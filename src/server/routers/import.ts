import { z } from 'zod'
import { router, editorProcedure } from '@/lib/trpc'
import { TRPCError } from '@trpc/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit, createRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit'

// Check for API key at startup
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.warn('⚠️ ANTHROPIC_API_KEY not set - AI extraction will fail')
}

const anthropic = new Anthropic({
  apiKey: apiKey || 'missing-key', // Will fail gracefully with clear error
})

const extractedRiskSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum([
    'STRATEGIC', 'OPERATIONAL', 'FINANCIAL', 'COMPLIANCE',
    'TECHNOLOGY', 'REPUTATIONAL', 'ENVIRONMENTAL', 'PEOPLE',
  ]),
  inherentLikelihood: z.number().min(1).max(5),
  inherentImpact: z.number().min(1).max(5),
  residualLikelihood: z.number().min(1).max(5),
  residualImpact: z.number().min(1).max(5),
  response: z.enum(['AVOID', 'MITIGATE', 'TRANSFER', 'ACCEPT']).optional(),
  controls: z.string().optional(),
  confidence: z.number().min(0).max(1),
})

export type ExtractedRisk = z.infer<typeof extractedRiskSchema>

const EXTRACTION_PROMPT = `You are a risk management expert. Analyse the following document and extract all risks mentioned.

For each risk, provide:
1. title: A concise risk title (max 100 chars)
2. description: Detailed description of the risk
3. category: One of STRATEGIC, OPERATIONAL, FINANCIAL, COMPLIANCE, TECHNOLOGY, REPUTATIONAL, ENVIRONMENTAL, PEOPLE
4. inherentLikelihood: Likelihood before controls (1=Rare, 2=Unlikely, 3=Possible, 4=Likely, 5=Almost Certain)
5. inherentImpact: Impact before controls (1=Insignificant, 2=Minor, 3=Moderate, 4=Major, 5=Catastrophic)
6. residualLikelihood: Likelihood after controls (same scale, usually lower or equal to inherent)
7. residualImpact: Impact after controls (same scale, usually lower or equal to inherent)
8. response: Risk response strategy - AVOID, MITIGATE, TRANSFER, or ACCEPT
9. controls: Any mentioned mitigating controls or actions
10. confidence: Your confidence in this extraction (0.0 to 1.0)

If the document doesn't contain clear risks, try to identify potential risks from the context.
If scoring information isn't explicitly provided, estimate reasonable scores based on the severity described.

Return ONLY a JSON array of risk objects. No other text.

Example output:
[
  {
    "title": "Data breach from phishing attacks",
    "description": "Risk of unauthorized access to sensitive data through phishing emails targeting employees",
    "category": "TECHNOLOGY",
    "inherentLikelihood": 4,
    "inherentImpact": 4,
    "residualLikelihood": 2,
    "residualImpact": 3,
    "response": "MITIGATE",
    "controls": "Security awareness training, email filtering, MFA implementation",
    "confidence": 0.85
  }
]

Document to analyse:
`

export const importRouter = router({
  // Extract risks from documents using AI (EDITOR+)
  extractFromDocument: editorProcedure
    .input(z.object({
      content: z.string(),
      fileType: z.enum(['pdf', 'docx', 'txt']),
      fileName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Rate limit: 5 import requests per minute per user
      checkRateLimit(
        createRateLimitKey(ctx.user.id, ctx.user.orgId, 'import'),
        RATE_LIMITS.import
      )

      // Check API key first
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'ANTHROPIC_API_KEY not configured. Add it to .env.local file.',
        })
      }

      console.log(`[AI Extract] Processing ${input.fileName} (${input.content.length} chars)`)

      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: EXTRACTION_PROMPT + input.content,
            },
          ],
        })

        const textContent = response.content.find(c => c.type === 'text')
        if (!textContent || textContent.type !== 'text') {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No response from AI' })
        }

        const rawText = textContent.text.trim()
        let jsonText = rawText

        // 1. Strip markdown code fences wherever they appear (handles preamble before the fence)
        const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
        if (fenceMatch) {
          jsonText = fenceMatch[1].trim()
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
        }

        // 2. Seek the first '[' in case the model added preamble text before the array
        const arrayStart = jsonText.indexOf('[')
        if (arrayStart > 0) {
          jsonText = jsonText.substring(arrayStart)
        }

        let parsed: unknown
        try {
          parsed = JSON.parse(jsonText)
        } catch {
          console.error('[AI Extract] JSON parse failed. Raw response (first 400 chars):', rawText.slice(0, 400))
          throw new TRPCError({
            code: 'PARSE_ERROR',
            message: 'AI could not return structured data from this document. The file may be too short, unclear, or in an unsupported format. Try the Excel/CSV import instead.',
          })
        }

        if (!Array.isArray(parsed)) {
          throw new TRPCError({
            code: 'PARSE_ERROR',
            message: 'AI response is not an array'
          })
        }

        // Validate and clean each risk
        const risks: ExtractedRisk[] = []
        for (const item of parsed) {
          try {
            const validated = extractedRiskSchema.parse(item)
            risks.push(validated)
          } catch {
            // Skip invalid items but log for debugging
            console.warn('Skipped invalid risk item:', item)
          }
        }

        return {
          risks,
          totalFound: parsed.length,
          validCount: risks.length,
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error

        // Log full error for debugging
        console.error('AI extraction error:', error)

        // Extract meaningful error message
        let errorMessage = 'Failed to extract risks from document'
        if (error instanceof Error) {
          errorMessage = error.message
          // Check for common Anthropic API errors
          if (error.message.includes('credit balance') || error.message.includes('purchase credits')) {
            errorMessage = 'Anthropic API credits exhausted. Please add credits at console.anthropic.com'
          } else if (error.message.includes('401') || error.message.includes('authentication')) {
            errorMessage = 'Invalid ANTHROPIC_API_KEY. Check your .env.local file.'
          } else if (error.message.includes('429')) {
            errorMessage = 'API rate limit exceeded. Please wait and try again.'
          } else if (error.message.includes('500')) {
            errorMessage = 'AI service temporarily unavailable. Try again later.'
          }
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage
        })
      }
    }),

  // Suggest column mappings for imports (EDITOR+)
  suggestMappings: editorProcedure
    .input(z.object({
      headers: z.array(z.string()),
      sampleData: z.array(z.array(z.string())).optional(),
    }))
    .mutation(async ({ input }) => {
      // Smart field mapping based on common header names
      const mappingSuggestions: Record<string, { field: string; confidence: number }> = {}

      const FIELD_PATTERNS: Record<string, { patterns: RegExp[]; field: string }[]> = {
        title: [
          { patterns: [/^title$/i, /^risk\s*name$/i, /^name$/i, /^risk$/i, /^risk\s*title$/i], field: 'title' },
        ],
        description: [
          { patterns: [/^description$/i, /^desc$/i, /^risk\s*description$/i, /^details$/i, /^summary$/i], field: 'description' },
        ],
        category: [
          { patterns: [/^category$/i, /^type$/i, /^risk\s*type$/i, /^risk\s*category$/i, /^class$/i], field: 'category' },
        ],
        inherentLikelihood: [
          { patterns: [/^inherent\s*likelihood$/i, /^likelihood$/i, /^probability$/i, /^prob$/i, /^l$/i, /^inh?\s*l$/i], field: 'inherentLikelihood' },
        ],
        inherentImpact: [
          { patterns: [/^inherent\s*impact$/i, /^impact$/i, /^consequence$/i, /^severity$/i, /^i$/i, /^inh?\s*i$/i], field: 'inherentImpact' },
        ],
        residualLikelihood: [
          { patterns: [/^residual\s*likelihood$/i, /^res\s*likelihood$/i, /^res\s*l$/i, /^rl$/i], field: 'residualLikelihood' },
        ],
        residualImpact: [
          { patterns: [/^residual\s*impact$/i, /^res\s*impact$/i, /^res\s*i$/i, /^ri$/i], field: 'residualImpact' },
        ],
        response: [
          { patterns: [/^response$/i, /^treatment$/i, /^risk\s*response$/i, /^strategy$/i], field: 'response' },
        ],
        controls: [
          { patterns: [/^control/i, /^mitigation/i, /^action/i, /^measure/i], field: 'controls' },
        ],
        status: [
          { patterns: [/^status$/i, /^state$/i, /^risk\s*status$/i], field: 'status' },
        ],
        owner: [
          { patterns: [/^owner$/i, /^risk\s*owner$/i, /^responsible$/i, /^assigned$/i], field: 'owner' },
        ],
      }

      for (const header of input.headers) {
        const normalizedHeader = header.trim()

        for (const [, mappings] of Object.entries(FIELD_PATTERNS)) {
          for (const mapping of mappings) {
            for (const pattern of mapping.patterns) {
              if (pattern.test(normalizedHeader)) {
                const existingConfidence = mappingSuggestions[normalizedHeader]?.confidence || 0
                const newConfidence = pattern.source.startsWith('^') && pattern.source.endsWith('$') ? 1.0 : 0.8

                if (newConfidence > existingConfidence) {
                  mappingSuggestions[normalizedHeader] = {
                    field: mapping.field,
                    confidence: newConfidence,
                  }
                }
                break
              }
            }
          }
        }
      }

      return { suggestions: mappingSuggestions }
    }),
})
