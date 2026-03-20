import { z } from 'zod'
import { router, protectedProcedure, riskManagerProcedure } from '@/lib/trpc'
import { db } from '@/lib/db'
import { TRPCError } from '@trpc/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit, createRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit'

// AI Analysis response structure
interface AIAnalysisResponse {
  executiveSummary: string
  suggestedControls: string[]
  scoreJustification: {
    likelihood: string
    impact: string
    overall: string
  }
  relatedCategories: string[]
  suggestedKRIs: {
    name: string
    description: string
    unit: string
    threshold: string
  }[]
  confidence: number
}

const RISK_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  STRATEGIC: 'Strategic risks affecting long-term objectives and competitive position',
  OPERATIONAL: 'Risks from internal processes, systems, and day-to-day operations',
  FINANCIAL: 'Risks related to financial performance, liquidity, and markets',
  COMPLIANCE: 'Regulatory, legal, and compliance-related risks',
  TECHNOLOGY: 'IT systems, cybersecurity, and technology infrastructure risks',
  REPUTATIONAL: 'Brand, public perception, and stakeholder relationship risks',
  ENVIRONMENTAL: 'Environmental impact, sustainability, and climate-related risks',
  PEOPLE: 'Human resources, workforce, and organizational culture risks',
}

export const aiAnalysisRouter = router({
  // Get existing analysis for a risk
  get: protectedProcedure
    .input(z.object({ riskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const risk = await db.risk.findFirst({
        where: {
          id: input.riskId,
          register: { orgId: ctx.user.orgId },
        },
        include: { aiAnalysis: true },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      return risk.aiAnalysis
    }),

  // Generate new AI analysis (RISK_MANAGER+)
  generate: riskManagerProcedure
    .input(z.object({ riskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Rate limit: 10 AI requests per minute per user
      checkRateLimit(
        createRateLimitKey(ctx.user.id, ctx.user.orgId, 'ai-analysis'),
        RATE_LIMITS.ai
      )

      // Verify risk belongs to user's org
      const risk = await db.risk.findFirst({
        where: {
          id: input.riskId,
          register: { orgId: ctx.user.orgId },
        },
        include: {
          register: true,
          owner: { select: { name: true } },
          aiAnalysis: true,
        },
      })

      if (!risk) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Risk not found' })
      }

      // Check API key
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI analysis is not configured. Please contact your administrator.',
        })
      }

      // Build the analysis prompt
      const prompt = buildAnalysisPrompt(risk)

      try {
        // Call Claude API
        const anthropic = new Anthropic({ apiKey })

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        })

        // Extract text response
        const textContent = message.content.find((c) => c.type === 'text')
        if (!textContent || textContent.type !== 'text') {
          throw new Error('No text response from AI')
        }

        // Parse the JSON response
        const responseText = textContent.text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('Could not parse AI response as JSON')
        }

        const analysisData = JSON.parse(jsonMatch[0]) as AIAnalysisResponse

        // Format the data for storage
        const summary = analysisData.executiveSummary
        const suggestedControls = analysisData.suggestedControls
          .map((c, i) => `${i + 1}. ${c}`)
          .join('\n')
        const scoreJustification = [
          `**Likelihood (${risk.residualLikelihood}/5):** ${analysisData.scoreJustification.likelihood}`,
          `**Impact (${risk.residualImpact}/5):** ${analysisData.scoreJustification.impact}`,
          `**Overall Assessment:** ${analysisData.scoreJustification.overall}`,
        ].join('\n\n')
        const relatedRisks = analysisData.relatedCategories
        const confidence = analysisData.confidence

        // Format suggested KRIs as additional info in controls
        const kriSuggestions =
          analysisData.suggestedKRIs.length > 0
            ? '\n\n**Suggested KRIs to Monitor:**\n' +
              analysisData.suggestedKRIs
                .map((kri) => `• ${kri.name} (${kri.unit}) - ${kri.description}`)
                .join('\n')
            : ''

        // Upsert the analysis
        const aiAnalysis = await db.aIAnalysis.upsert({
          where: { riskId: input.riskId },
          create: {
            riskId: input.riskId,
            summary,
            suggestedControls: suggestedControls + kriSuggestions,
            scoreJustification,
            relatedRisks,
            modelVersion: 'claude-sonnet-4-20250514',
            confidence,
          },
          update: {
            summary,
            suggestedControls: suggestedControls + kriSuggestions,
            scoreJustification,
            relatedRisks,
            modelVersion: 'claude-sonnet-4-20250514',
            generatedAt: new Date(),
            confidence,
          },
        })

        return aiAnalysis
      } catch (error) {
        console.error('[ai-analysis] Error generating analysis:', error)

        // Check for specific API errors
        if (error instanceof Anthropic.APIError) {
          if (error.status === 400 && error.message.includes('credit')) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'AI service credits exhausted. Please contact your administrator.',
            })
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `AI service error: ${error.message}`,
          })
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate AI analysis. Please try again.',
        })
      }
    }),

  // Quick suggestions for risk form (lightweight, fast)
  suggest: protectedProcedure
    .input(z.object({
      description: z.string().min(50, 'Description too short for suggestions'),
      title: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Rate limit: 20 suggestion requests per minute (more lenient)
      checkRateLimit(
        createRateLimitKey(ctx.user.id, ctx.user.orgId, 'ai-suggest'),
        { windowMs: 60 * 1000, maxRequests: 20 }
      )

      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'AI not configured',
        })
      }

      try {
        const anthropic = new Anthropic({ apiKey })

        const prompt = `Based on this risk description, suggest the most appropriate category and risk scores.

Risk Title: ${input.title || 'Not provided'}
Risk Description: ${input.description}

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "category": "STRATEGIC|OPERATIONAL|FINANCIAL|COMPLIANCE|TECHNOLOGY|REPUTATIONAL|ENVIRONMENTAL|PEOPLE|HEALTH_SAFETY",
  "likelihood": 1-5,
  "impact": 1-5,
  "reasoning": "Brief 10-word max explanation"
}

Categories:
- STRATEGIC: Long-term business strategy risks
- OPERATIONAL: Day-to-day process risks
- FINANCIAL: Money, revenue, cost risks
- COMPLIANCE: Regulatory, legal risks
- TECHNOLOGY: IT, cyber, systems risks
- REPUTATIONAL: Brand, PR risks
- ENVIRONMENTAL: Climate, sustainability risks
- PEOPLE: HR, workforce risks

Likelihood scale: 1=Rare, 2=Unlikely, 3=Possible, 4=Likely, 5=Almost Certain
Impact scale: 1=Insignificant, 2=Minor, 3=Moderate, 4=Major, 5=Catastrophic`

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        })

        const textContent = message.content.find((c) => c.type === 'text')
        if (!textContent || textContent.type !== 'text') {
          throw new Error('No response')
        }

        let jsonText = textContent.text.trim()
        // Handle markdown code blocks
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        }

        const parsed = JSON.parse(jsonText) as {
          category: string
          likelihood: number
          impact: number
          reasoning: string
        }

        return {
          category: parsed.category,
          likelihood: Math.min(5, Math.max(1, parsed.likelihood)),
          impact: Math.min(5, Math.max(1, parsed.impact)),
          reasoning: parsed.reasoning,
        }
      } catch (error) {
        // Don't throw - just return null for suggestions
        console.error('[ai-suggest] Error:', error)
        return null
      }
    }),
})

function buildAnalysisPrompt(risk: {
  title: string
  description: string
  category: string
  inherentLikelihood: number
  inherentImpact: number
  inherentScore: number
  residualLikelihood: number
  residualImpact: number
  residualScore: number
  response: string
  controls: string | null
  status: string
  owner: { name: string | null } | null
}): string {
  const categoryDesc = RISK_CATEGORY_DESCRIPTIONS[risk.category] || risk.category

  return `You are an expert risk management analyst for a South African business. Analyse the following risk and provide comprehensive insights.

## Risk Details

**Title:** ${risk.title}
**Category:** ${risk.category} (${categoryDesc})
**Description:** ${risk.description}

**Risk Scores:**
- Inherent Risk: Likelihood ${risk.inherentLikelihood}/5, Impact ${risk.inherentImpact}/5, Score ${risk.inherentScore}/25
- Residual Risk: Likelihood ${risk.residualLikelihood}/5, Impact ${risk.residualImpact}/5, Score ${risk.residualScore}/25
- Risk Reduction: ${((1 - risk.residualScore / risk.inherentScore) * 100).toFixed(0)}%

**Current Response Strategy:** ${risk.response}
**Current Controls:** ${risk.controls || 'None documented'}
**Status:** ${risk.status}
**Owner:** ${risk.owner?.name || 'Unassigned'}

## Analysis Required

Provide your analysis as a JSON object with the following structure:

{
  "executiveSummary": "2-3 sentence executive summary of this risk and its potential impact on the organisation",
  "suggestedControls": [
    "Specific, actionable control recommendation 1",
    "Specific, actionable control recommendation 2",
    "Specific, actionable control recommendation 3",
    "Specific, actionable control recommendation 4 (if applicable)",
    "Specific, actionable control recommendation 5 (if applicable)"
  ],
  "scoreJustification": {
    "likelihood": "Explanation of why the likelihood score is appropriate",
    "impact": "Explanation of why the impact score is appropriate",
    "overall": "Overall assessment of whether the current scoring is appropriate and any recommendations"
  },
  "relatedCategories": ["CATEGORY1", "CATEGORY2"],
  "suggestedKRIs": [
    {
      "name": "KRI Name",
      "description": "What this KRI measures",
      "unit": "Measurement unit (%, count, days, etc.)",
      "threshold": "Suggested threshold for alerting"
    }
  ],
  "confidence": 0.85
}

## Guidelines

1. **Executive Summary**: Be concise but capture the essence of the risk and its potential business impact
2. **Suggested Controls**: Provide 3-5 specific, practical controls tailored to this risk. Consider South African regulatory context (POPIA, King V, etc.) where relevant
3. **Score Justification**: Evaluate if the current likelihood and impact scores seem reasonable given the risk description
4. **Related Categories**: List other risk categories (from: STRATEGIC, OPERATIONAL, FINANCIAL, COMPLIANCE, TECHNOLOGY, REPUTATIONAL, ENVIRONMENTAL, PEOPLE, HEALTH_SAFETY) that might be affected by this risk
5. **Suggested KRIs**: Recommend 2-3 Key Risk Indicators that could help monitor this risk
6. **Confidence**: A value between 0.0 and 1.0 indicating your confidence in this analysis based on the information provided

Respond ONLY with the JSON object, no additional text.`
}
