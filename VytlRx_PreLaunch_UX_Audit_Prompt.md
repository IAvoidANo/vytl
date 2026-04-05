# VytlRx Pre-Launch Readiness Audit
## Claude Code Execution Prompt (Sonnet)

**Purpose:** Audit the VytlRx codebase for pre-launch readiness across six critical dimensions before structured user testing in mid-April 2026.  
**Executor:** Claude Sonnet via Claude Code  
**Read-only:** Do NOT modify any files. Produce a structured audit report only.  
**Output file:** Write the completed report to `AUDIT_PreLaunch_UX_[date].md` in the project root.

---

## Context You Must Understand Before Starting

VytlRx is an AI-powered GRC SaaS platform positioned as a Virtual Chief Risk Officer (vCRO) for South African SMEs and mid-market companies. The product is technically complete (13 sprints) but not yet commercially launchable. The gap is self-service onboarding: users currently land on an empty dashboard and abandon before seeing value.

**The core hypothesis being tested:** Can a user see their business risk health score in under 10 minutes, without human guidance?

**Success criteria for launch (from the self-service launch plan):**
- 8/10 test users reach a populated dashboard in under 10 minutes
- Economic buyer (CEO/CFO) can explain VytlRx value in one sentence
- Zero critical bugs in the signup-to-dashboard flow
- VytlRx Score is visible, legible, and explainable within the first session

**Target users (two distinct personas you must keep in mind):**
1. The practitioner: Risk manager, compliance officer, CA in an SME. Technically literate. Cares about methodology, ISO 31000 alignment, control effectiveness.
2. The economic buyer: CEO or CFO who authorises the subscription. Does NOT want to learn risk methodology. Wants a single number, a trend, and a board-ready output.

**The product rename:** The product was renamed from "Vytl Score" to "VytlRx" (and "Vytl Score" to "VytlRx Score"). Flag any instances of the old name still visible in UI-facing strings.

---

## Audit Instructions

Work through each of the six audit dimensions below in order. For each dimension:

1. Read the relevant component and page files listed.
2. Assess the actual implementation against the acceptance criteria.
3. Produce a finding for each issue, rated by severity:
   - **P0 (Launch Blocker):** Will cause abandonment or prevent core workflow completion.
   - **P1 (Pre-Launch Fix):** Significant friction; must be resolved before user testing.
   - **P2 (Polish):** Noticeable but not blocking; address after user testing.
4. Where code evidence supports a finding, quote the relevant lines.

Do not infer what the UI looks like from screenshots. Read the actual component code.

---

## Dimension 1: First-Time User Experience (FTUE) and Onboarding

**Question:** What does a brand-new user with zero data actually see and experience?

**Files to read:**
- `src/app/dashboard/page.tsx`
- `src/app/login/page.tsx`
- Any FTUE wizard or welcome modal component (search for files containing "welcome", "wizard", "onboarding", "ftue", or "industry" in `src/components/` and `src/app/`)
- `src/lib/industry-templates.ts` (if it exists)
- `src/server/routers/risk.ts` (check for template-seeding logic)

**Assess the following:**

1.1 Does an FTUE welcome wizard exist? If yes, describe its screens and flow. If no, this is a P0.

1.2 Is there an industry template selection step? Do the templates exist with populated risk data (minimum 15 risks per industry, SA-specific context)? If not implemented, this is a P0.

1.3 What does a user see on first login when the org has zero risks? Is there a meaningful empty state with a clear call to action, or a blank/broken dashboard?

1.4 Does the dashboard show a "sample data mode" or demo mode that inverts the value discovery sequence (show value first, then let the user personalise)?

1.5 Is there a "time to value" path visible from the login screen? Can a user understand what to do first without any guidance?

1.6 Does the signup flow exist at all (`/signup` route)? Or does the product only support admin-invited users? If self-serve signup is absent, this is a P0.

---

## Dimension 2: VytlRx Score Visibility and Explainability

**Question:** Can a user understand what the VytlRx Score means, why it is what it is, and what to do to improve it, within the first session?

**Files to read:**
- `src/components/vytl-score-card.tsx`
- `src/components/dashboard/widgets/vytl-score-widget.tsx`
- `src/lib/vytl-score.ts`
- `src/app/dashboard/page.tsx`
- Any score breakdown or dimension explanation component

**Assess the following:**

2.1 Is the VytlRx Score prominently displayed on the dashboard (above the fold, not buried)?

2.2 Does the score display include: the numeric score (0-100), the letter grade, and a brief plain-language interpretation? Flag if any of these are absent.

2.3 Are the four score dimensions (Coverage, Residual Control, KRI Alignment, Trend) visible to the user with individual scores? Can the user understand what is dragging their score down?

2.4 Is there a zero-state score scenario handled? When an org has no risks, what does the score show? Check for the known bug: zero-risk orgs returning a trend score of 12 instead of 0, causing the total to show 12/100 instead of 0/100. Is this fixed?

2.5 Does the score card use the old name "Vytl Score" anywhere in UI strings, labels, or headings? Flag every instance for rename.

2.6 Is there a plain-language explanation of what the score measures that a CEO (non-risk professional) could understand?

2.7 Is there a "what does this mean?" or "how is this calculated?" tooltip or help element accessible from the score card?

---

## Dimension 3: Critical Workflow Completeness

**Question:** Can a user complete the three core workflows end-to-end without getting stuck?

**Workflow A: Create a risk and see the score update**

Files to read:
- `src/components/risk-form.tsx`
- `src/app/risks/page.tsx` and `src/app/risks/risks-client.tsx`
- `src/app/risks/[id]/page.tsx` and `src/app/risks/[id]/risk-detail-client.tsx`

Assess:
3A.1 How many fields does the risk creation form have? Is it intimidating for a first-time user (more than 8 visible fields is a risk)?
3A.2 Are all required fields clearly marked?
3A.3 After creating a risk, does the user get clear feedback (toast, redirect, score update)?
3A.4 Does the VytlRx Score visibly update after a risk is added?
3A.5 Is there contextual help or tooltips explaining risk fields (likelihood, impact, etc.) in plain language?

**Workflow B: View the risk register and understand the risk landscape**

Files to read:
- `src/components/risk-table.tsx`
- `src/components/risk-heatmap.tsx`
- `src/app/risks/risks-client.tsx`

Assess:
3B.1 Does the risk register have a meaningful empty state when no risks exist?
3B.2 Is the heatmap legible for a non-expert user? Are axis labels clear?
3B.3 Can the user filter and sort risks without instruction?
3B.4 Is risk severity communicated clearly (colour coding, labels)?

**Workflow C: Generate a board report**

Files to read:
- `src/components/board-report-modal.tsx`
- `src/lib/board-report.ts`
- `src/app/reports/page.tsx` and `src/app/reports/reports-client.tsx`

Assess:
3C.1 Is the board report accessible from a prominent location (not buried in a sub-menu)?
3C.2 Does the report generation have a data readiness checklist? Does it clearly signal when there is insufficient data to generate a meaningful report?
3C.3 What happens if a user tries to generate a report with zero risks? Is this handled gracefully?
3C.4 Does the generated report look professional and board-ready, or does it look like a developer mockup?

---

## Dimension 4: Empty States and Zero-Data Handling

**Question:** Every screen that can have zero data must tell the user what to do. Blank screens kill conversion.

**Files to read (systematically review each):**
- `src/app/dashboard/page.tsx`
- `src/app/risks/risks-client.tsx`
- `src/app/kris/kris-client.tsx`
- `src/app/workspace/workspace-client.tsx`
- `src/app/reports/reports-client.tsx`
- `src/app/users/users-client.tsx`
- All widget files in `src/components/dashboard/widgets/`

For each screen and widget, assess:

4.1 Is there a meaningful empty state (not just "No data" or a blank table)?
4.2 Does the empty state include: what is missing, why it matters, and a clear CTA to fix it?
4.3 Are empty states consistent in style across screens?
4.4 List every screen or widget that renders a blank/broken state with zero data (P0 if it appears in the primary dashboard view).

---

## Dimension 5: Economic Buyer Legibility

**Question:** If a CFO or CEO logs in for the first time, can they understand the value proposition without asking anyone for help?

This dimension is assessed by reading the UI text (labels, headings, tooltips, empty states, onboarding copy) rather than just component structure.

**Files to read:**
- All dashboard page and widget files
- `src/app/dashboard/page.tsx`
- `src/components/vytl-score-card.tsx`
- Any onboarding or welcome component identified in Dimension 1
- `src/app/reports/reports-client.tsx`

Assess:

5.1 Is the core value proposition stated anywhere in the authenticated UI (e.g., dashboard heading, welcome message, or score card subtitle)?

5.2 Are there jargon-heavy labels that a CEO would not understand without explanation? List every instance of: ISO 31000 terminology used without explanation, acronyms not spelled out, and risk methodology terms used as primary navigation labels.

5.3 Is the VytlRx Score framed in business language (e.g., "Your business risk health score") or in technical language (e.g., "Composite governance effectiveness metric")?

5.4 Is there a single sentence anywhere in the UI that a user could read and repeat to their CFO? If not, this is a P1.

5.5 Does the board report feature surface prominently as "show this to your board" rather than being buried as a technical export?

5.6 Are KRIs (Key Risk Indicators) explained in plain language anywhere in the UI, or do they require prior knowledge to understand?

---

## Dimension 6: Navigation, Wayfinding, and Error Handling

**Question:** Can a user always tell where they are, how to go back, and what to do when something goes wrong?

**Files to read:**
- `src/components/sidebar.tsx`
- `src/components/header.tsx`
- `src/app/error.tsx`
- `src/app/not-found.tsx`
- `src/components/error-boundary.tsx`
- `src/components/command-palette.tsx`

Assess:

6.1 Is the navigation structure logical for the target audience? Are the primary items in the correct priority order for a first-time user?

6.2 Is the active navigation item clearly indicated?

6.3 Is there a way to get help or find features quickly (e.g., command palette, search, onboarding tooltips)?

6.4 Does the application handle errors gracefully (e.g., API failure, network error) with user-friendly messages and recovery options?

6.5 Is the 404 page functional and does it provide a way back?

6.6 Are there any dead-end navigation states where the user has no visible path forward?

6.7 Are loading states implemented across data-fetching screens, or do screens flicker/blank while data loads?

---

## Rename Audit (Cross-Cutting)

In addition to the six dimensions, perform a search across all UI-facing files for the old product name.

Search all `.tsx` and `.ts` files under `src/` for:
- `"Vytl Score"` (old name, any capitalisation)
- `"VytlScore"` (camelCase variant)
- `"vytl score"` (lowercase)
- `"vytlScore"` (camelCase in strings/labels)

Exclude: test files, comments, and variable names (only flag user-visible strings in JSX, aria-labels, placeholders, and toast messages).

Produce a list of every file and line number where the old name appears in a user-visible context.

---

## Report Format

Write the output report using the following structure:

```
# VytlRx Pre-Launch Readiness Audit
Date: [date]
Executor: Claude Sonnet (Claude Code)

## Executive Summary
[3-5 sentences: overall readiness, number of P0/P1/P2 findings, go/no-go recommendation for mid-April user testing]

## Launch Readiness Score
P0 blockers: [n]
P1 pre-launch fixes: [n]
P2 polish items: [n]
Recommendation: GO / CONDITIONAL GO / NO-GO

## Dimension 1: FTUE and Onboarding
[Finding + severity + code evidence for each issue]

## Dimension 2: VytlRx Score Visibility
[...]

## Dimension 3: Critical Workflow Completeness
[...]

## Dimension 4: Empty States
[...]

## Dimension 5: Economic Buyer Legibility
[...]

## Dimension 6: Navigation and Error Handling
[...]

## Rename Audit
[List of files/lines with old name in user-visible strings]

## Prioritised Fix List
[Ordered list: P0s first, then P1s, then P2s. Each item: description, file(s) affected, estimated effort (S/M/L)]
```

---

## Execution Constraints

- Read only. Do not modify any source files.
- Do not run the dev server or execute any code.
- Base all findings on static code analysis only.
- If a file does not exist where expected, note it as a finding (missing implementation).
- Aim to complete all six dimensions before writing the report. Do not write partial reports.
- Write the report to `AUDIT_PreLaunch_UX_[YYYY-MM-DD].md` in the project root.

**Recommended model:** Claude Sonnet 4.5 or later in Claude Code.
