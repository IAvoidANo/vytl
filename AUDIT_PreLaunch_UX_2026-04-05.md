# VytlRx Pre-Launch Readiness Audit
Date: 2026-04-05
Executor: Claude Sonnet (Claude Code)

---

## Executive Summary

VytlRx has a solid structural foundation: a functional onboarding wizard with industry template seeding, a working VytlRx Score with four visible dimensions, a multi-tab board report, and a command palette for quick navigation. However, three confirmed launch blockers must be resolved before user testing: (1) a trend score bug where orgs with risks but no prior assessment history receive a hardcoded 12/25 baseline instead of 0, inflating the total VytlRx Score immediately post-onboarding; (2) the onboarding welcome screen footer says "King V ready" while the entire product markets itself on King IV compliance — a credibility-damaging error on the first screen new users see; and (3) the weekly digest email uses the old label "VYTL SCORE" instead of "VytlRx Score." Beyond the three P0s, six P1 issues must be resolved before user testing begins (most critically: score not refreshing after risk creation, and no plain-language score interpretation on the dashboard). The recommendation is a **CONDITIONAL GO** for mid-April 2026 user testing, contingent on P0s and P1s being resolved first.

---

## Launch Readiness Score

P0 blockers: **3**
P1 pre-launch fixes: **6**
P2 polish items: **5**
Recommendation: **CONDITIONAL GO** (P0s and P1s must be fixed before user testing sessions begin)

---

## Dimension 1: FTUE and Onboarding

### 1.1 FTUE Welcome Wizard — PASS

A multi-step wizard exists at `/onboarding`. The flow is:

- `welcome` (WelcomeScreen) → `industry` (IndustrySelector) → `confirmation` (ConfirmationScreen), or
- `welcome` → `first-risk` (FirstRiskScreen) → dashboard, or
- `welcome` → import redirect (`/risks?import=true`)

The wizard gate is correctly symmetrical: `app/onboarding/page.tsx` redirects to `/dashboard` if the org already has risks, and `app/dashboard/page.tsx` redirects to `/onboarding` when `riskCount === 0`. New users are never dropped onto a blank dashboard.

### 1.2 Industry Templates — PASS with P1 caveat

Three industries are selectable in IndustrySelector: MANUFACTURING, FINANCIAL_SERVICES, RETAIL. Each shows `riskCount: 15` in the UI and `lib/industry-templates.ts` confirms 15 risks are defined per industry with SA-specific context (Eskom load shedding, POPIA, OHS Act, B-BBEE, Transnet, MERSETA, CCMA). Template count is accurate and localised.

**However:** `lib/industry-profiles.ts` defines scoring profiles for six industries. The public landing page (`app/page.tsx` line 153) lists "Financial Services, Mining & Resources, Healthcare, Manufacturing, Retail, Technology" as supported sectors. Only three have seeding templates. Mining, Healthcare, and Technology users must select the "closest match" — a friction point for users in those sectors who were attracted by the marketing copy.

**Finding 1.2-A (P1):** Only 3 of 6 marketed industries have onboarding templates. The landing page implies full coverage for Mining, Healthcare, and Technology. Users in these sectors will be disappointed and confused.

### 1.3 Zero-Risk First Login — PASS

Zero-risk orgs are intercepted at `dashboard/page.tsx` (line 28-30) and redirected to `/onboarding` before ever seeing the dashboard. The wizard is the zero-state experience. No blank dashboard is exposed.

### 1.4 Sample Data Mode — PASS

`confirmation-screen.tsx` (line 87-101) shows an amber "You're in sample data mode" notice. `components/sample-data-banner.tsx` renders persistently at the top of the authenticated layout with "You're viewing sample data for [industry]" and three CTAs: "Make This My Data," "Start Fresh," and dismiss. The banner uses the correct product name throughout.

### 1.5 Time-to-Value Path — PASS

`welcome-screen.tsx` line 83: "⚡ Recommended • 60 seconds to dashboard." The onboarding page metadata says "Set up your risk management dashboard in 5 minutes." The path is: register → verify email → onboarding wizard → industry select → confirmation → dashboard. The path is linear and clearly labelled.

### 1.6 Self-Serve Signup — PASS

`/register` exists (`app/register/page.tsx`). It collects: name, organisation name, work email, and password. The login page links to it ("Create one free"). Honeypot bot protection is in place. Self-serve onboarding is functional.

---

### Dimension 1 Bug Findings

**Finding 1.B (P0) — "King V ready" in Onboarding Welcome Screen Footer**

`app/onboarding/welcome-screen.tsx` line 140:
```tsx
<p className="mt-1">POPIA compliant &bull; ISO 31000 aligned &bull; King V ready</p>
```

The entire product — landing page, legal page, terms page, and regulatory framework definitions — consistently uses "King IV." "King V" is not the correct name of the South African governance code. Displaying "King V ready" on the first screen every new user sees will cause immediate credibility damage with any SA risk professional or compliance officer. This is the target audience's primary entry point.

---

## Dimension 2: VytlRx Score Visibility

### 2.1 Score Displayed Above the Fold — PASS

`dashboard-client.tsx` line 56-59 places `<HeroMetric />` immediately after the greeting heading, before the stat cards. All three score card variants (`vytl-score-card.tsx`, `vytl-score-card-compact.tsx`, `vytl-score-widget.tsx`) render an animated score circle prominently. Score is the first data element on the page.

### 2.2 Numeric Score + Letter Grade + Plain-Language Interpretation — PARTIAL PASS

All three score card variants display:
- Numeric score (0-100) in a large animated circle
- Letter grade (A/B/C/D/F) directly below the number

**Not present:** No plain-language interpretation of the score is rendered in any score card component. There is no sentence such as "Your risk posture is moderate — controls are partially effective." The labels `strong`, `acceptable`, `moderate`, `challenged` exist in `reports-client.tsx` but appear only inside the Reports section, not on the dashboard.

**Finding 2.2 (P1):** No plain-language interpretation of the VytlRx Score on the dashboard. A CEO opening the dashboard sees "58 C" with no contextual guidance on what that means for their business.

### 2.3 Four Score Dimensions Visible — PASS with naming note

All three score card variants render four labelled dimension bars: **Coverage**, **Controls**, **Maturity**, **Trend**. Individual scores are shown for each.

**Note:** The audit prompt specifies "Coverage, Residual Control, KRI Alignment, Trend" as the four expected dimensions. The implemented dimensions are `coverage`, `controlEffectiveness`, `maturity`, `trend` (confirmed in `lib/vytl-score.ts`). "KRI Alignment" is a per-risk scoring factor in the engine, not a top-level VytlRx Score dimension. The label "Maturity" is internal jargon that may not be meaningful to a non-risk user.

**Finding 2.3 (P2):** The label "Maturity" is not self-explanatory for a CEO. Marketing copy uses "KRI Alignment" as a dimension name but this does not appear in the product.

### 2.4 Zero-State Score Bug — CONFIRMED P0

`lib/vytl-score.ts` lines 276-289:
```ts
if (!lastAssessment || !lastAssessment.scoreBreakdown) {
  // Insufficient history — return neutral baseline (12/25)
  return {
    score: 12,
    maxScore: 25,
    details: {
      improving: 0,
      stable: currentRisks.length,
      worsening: 0,
      direction: 'insufficient_data',
    },
  }
}
```

When a new org has risks (e.g., just applied the industry template) but has never had a completed assessment saved, `getLatestAssessment` returns null. The trend dimension returns 12/25 instead of 0/25. With coverage=0, controlEffectiveness=0, maturity=0, the total VytlRx Score is **12/100** — presented as a real score to the user immediately after onboarding.

Note: the path where `currentRisks.length === 0` correctly returns `score: 0` (line 258-269). The bug is specifically triggered for orgs that have risks (e.g., template seeded) but no prior saved assessment.

**Finding 2.4 (P0):** New orgs completing onboarding with template risks see a score of 12/100 immediately, not because they earned it, but because of a hardcoded neutral baseline. This corrupts the first impression of the VytlRx Score and is the known trend score bug.

### 2.5 Old Name "Vytl Score" in Score Components — CLEAN (with one exception elsewhere)

Score cards consistently display "VytlRx Score" as the heading:
- `vytl-score-card.tsx` line 165: ✓ "VytlRx Score"
- `vytl-score-card-compact.tsx` line 156: ✓ "VytlRx Score"
- `vytl-score-widget.tsx` line 138: ✓ "VytlRx Score"

The old name was found elsewhere — see Rename Audit section.

### 2.6 Plain-Language CEO Explanation — FAIL

No plain-language sentence is shown anywhere on the authenticated dashboard explaining what the VytlRx Score means in business terms. See Finding 2.2.

### 2.7 "What does this mean?" Tooltip or Help — NOT PRESENT

None of the three score card variants include a tooltip, info icon, or help link. The `scoring-recommendations-widget.tsx` provides "Risk Intelligence Alerts" which offer some context, but this is a separate widget and may not always be visible.

**Finding 2.7 (P2):** No tooltip or help element on the score card explaining the grade scale, what each dimension measures, or what actions improve the score.

---

## Dimension 3: Critical Workflow Completeness

### Workflow A — Create a Risk and See the Score Update

**3A.1 Field Count — EXCEEDS THRESHOLD**

Fields visible in `risk-form.tsx` on first open for a new risk:
1. Title (required)
2. Register (required)
3. Category (required)
4. Description (required)
5. Inherent Likelihood (slider, 1-5)
6. Inherent Impact (slider, 1-5)
7. Residual Likelihood (slider, 1-5)
8. Residual Impact (slider, 1-5)
9. Financial Exposure (optional)
10. Risk Response (radio group, 4 options)
11. Control Description (textarea)
12. Control Effectiveness (select)
13. Root Cause (textarea)
14. Owner (select)
15. Due Date (date picker)
16. Ongoing (checkbox)

That is **16 visible fields** in a scrolling modal (`max-h-[90vh]`). Required fields are mixed with optional fields without clear visual separation.

**Finding 3A.1 (P1):** The risk creation form has 16 visible fields — double the 8-field threshold. For a first-time user who has never entered a risk before, this is a conversion-killing barrier.

**3A.2 Required Fields Marked — PARTIAL**

Asterisked fields: Title *, Register *, Category *, Description *, Risk Response *. Scoring sliders (Inherent/Residual Likelihood/Impact) have no asterisk. Optional fields (Financial Exposure, Root Cause, Control Description, Control Effectiveness, Owner, Due Date) have no asterisk and no "optional" label — the distinction is invisible.

**3A.3 Post-Creation Feedback — PARTIAL**

`risk-form.tsx` lines 120-131: on create mutation `onSuccess`, the modal closes via `onSuccess()`. No toast notification is wired at the form level. No score-update prompt. No redirect. Outside the onboarding context, there is no visible confirmation that the risk was saved.

**Finding 3A.3 (P1):** After creating a risk from the Risks page, the modal closes silently. No toast, no score-update hint. Users may not know whether submission succeeded.

**3A.4 VytlRx Score Update After Adding Risk — NOT AUTOMATIC**

The score card calls `trpc.assessment.current.useQuery()` which returns the most recently saved assessment. There is no automatic query invalidation after `risk.create` succeeds. The score does not recalculate. The user must manually click a "Recalculate" button.

**Finding 3A.4 (P1):** Adding a risk does not trigger a VytlRx Score refresh. The dashboard shows a stale score until manual action. This breaks the primary value loop — the instant feedback that risk input drives a better score.

**3A.5 Contextual Help for Risk Fields — NOT PRESENT**

The risk form sliders show "Likelihood (1-5): 3" and "Impact (1-5): 3" with no explanation of what the scale means, no examples, and no explanation of the difference between Inherent and Residual risk. The `first-risk-screen.tsx` does show brief labels ("Before controls" / "After controls") within the onboarding wizard only.

**Finding 3A.5 (P2):** No tooltips or contextual help on risk scoring fields. Users unfamiliar with risk methodology cannot self-serve.

---

### Workflow B — View the Risk Register

**3B.1 Empty State — WEAK**

`risk-table.tsx` line 177:
```tsx
<p className="text-slate-400 mb-2">No risks found</p>
```
Single line of muted text. No CTA, no icon, no explanation. (Note: the redirect to onboarding when `riskCount === 0` means a pristine-org user normally won't reach this state, but a user who filters or deletes all sample data will.)

**Finding 3B.1 (P1):** The risk table empty state is a single text line with no call to action. Filtered or cleared views leave users stranded.

**3B.2 Heatmap Legibility — PASS**

`risk-heatmap.tsx` renders: LIKELIHOOD as a rotated Y-axis label, impact categories across the top (Insignificant / Minor / Moderate / Major / Catastrophic), and likelihood labels on rows (Rare / Unlikely / Possible / Likely / Almost Certain). Cells show risk count on hover. Legible for non-experts.

**3B.3 Filter/Sort Without Instruction — PASS**

Register, Category, and Status dropdown filters are clearly labelled. Table and Heatmap view toggle buttons are labelled. No instruction required.

**3B.4 Risk Severity Communication — PASS**

Coloured status badges (OPEN=blue, IN_PROGRESS=yellow, MONITORING=purple, CLOSED=green), appetite-based band colours on the heatmap, and `RiskScoreBadge` component are all present. Severity is communicated visually with colour and text labels.

---

### Workflow C — Generate a Board Report

**3C.1 Board Report Accessibility — PASS**

"Reports" is item #6 in the sidebar nav. The `ConfirmationScreen` during onboarding explicitly mentions "Generate your first board report" as a next step. The landing page features "Board-Ready Reports" prominently. A "Print Report" button sits at the top-right of the reports page.

**3C.2 Data Readiness Checklist — NOT PRESENT**

`reports-client.tsx` line 63: `const dataReady = org && riskStats && topRisks && risks` — this only checks for API response presence, not data quality. No checklist or warning appears when data is sparse. A user with one risk and no KRIs can generate and print a "board report" with near-empty sections.

**Finding 3C.2 (P2):** No data readiness warning before report generation. Users with thin data can generate a misleading-looking board report.

**3C.3 Zero-Risk Report Handling — PARTIAL**

If `topRisks` returns an empty array, the "Top 10 Risks" tab renders an empty table without comment. The Executive Summary renders with `total=0` and `vytlScore=null`. No explicit "you have no risks; this report will be empty" warning is shown.

**3C.4 Report Board-Readiness — PASS**

The report has eight tabs: Executive Summary, Risk Overview, Top 10 Risks, Heatmap, Category Trends, Recommendations, KRI Status, Movement & Trends. The Executive Summary generates narrative prose with dynamic values. `lib/board-report.ts` uses jsPDF with styled layouts for PDF export. This is functionally board-ready, not a developer mockup.

---

## Dimension 4: Empty States

| Screen / Widget | Empty State Quality | CTA Present | Finding |
|---|---|---|---|
| Dashboard (zero risks) | Redirected to onboarding — never shown | N/A | PASS |
| Risk Table (no results) | "No risks found" — plain text only | No | P1 |
| Activity Feed Widget | "No recent activity / Actions will appear here" | No | P2 |
| Appetite Breach Widget | "0 — all within appetite" (positive framing) | "Configure appetite" link | PASS |
| Category Chart Widget | "No data to display" + PieChart icon | No | P2 |
| Compliance Coverage Widget | "No mappings yet / Map risks to regulatory requirements" | No | P2 |
| Scoring Recommendations Widget | "No alerts / Risk intelligence alerts will appear here" | No | P2 |
| Actions Overview Widget | "0 — all on track" (positive framing) | "View all actions" link | PASS |
| KRI Client (no KRIs) | Stat cards (all zeros) + "Add KRI" button — no narrative empty state | Add KRI button | P2 |
| Workspace Client | Kanban columns rendered empty — no empty state prose | None | P2 |
| Users Client | Table header with no rows — no empty state observed | None | P2 |
| Reports (no data) | Loading spinner only — no "insufficient data" warning | None | P2 |
| Sample Data Banner | Clear and contextual | "Make This My Data" / "Start Fresh" | PASS |

**Finding 4.1 (P1):** Risk Table empty state (`"No risks found"`) has no CTA. Users who filter out all results or delete sample data see only muted text.

**Finding 4.2 (P2):** Category Chart Widget shows only "No data to display" with an icon but no explanation of what categories are or how to add them.

**Finding 4.3 (P2):** Empty states are inconsistent across the app. Some use icon + two descriptive lines (Activity Feed, Recommendations, Compliance). Some use a positive "all clear" framing (Appetite Breach, Actions Overview). Some show only one line of text (Risk Table, Category Chart). There is no shared `EmptyState` component or consistent pattern.

---

## Dimension 5: Economic Buyer Legibility

### 5.1 Core Value Proposition in Authenticated UI — WEAK

The public landing page has strong VP copy ("Intelligent risk, simplified"). Inside the authenticated app, the sidebar footer reads "Risk Intelligence" under the VytlRx logo. The `header.tsx` line 43 reads "Risk Management" — a generic description. No sentence inside the authenticated app tells a new user why VytlRx is better than a spreadsheet or what they are trying to achieve.

**Finding 5.1 (P1):** No value proposition statement is visible to authenticated users. The first sentence a logged-in user reads is "Good morning, [Name]" — not a context-setting statement about what VytlRx enables.

### 5.2 Jargon-Heavy Labels — PRESENT

User-visible labels that appear without explanation in primary navigation or dashboard:

- **"KRIs"** — sidebar nav item; not explained anywhere in the authenticated UI. First appearance is a nav label.
- **"Workspace"** — sidebar nav item using a Kanban structure (INBOX / TRIAGE / ASSIGNED / APPROVED) not self-explanatory to a risk committee member.
- **"Risk Appetite"** — used in the AppetiteBreachWidget header without explanation.
- **"Inherent Risk" / "Residual Risk"** — used as section headers in the risk form without tooltip.
- **"ISO 31000"**, **"King IV"**, **"POPIA"** — appear in landing page with brief context; appear inside the app in compliance widgets and nav without glossary.

**Finding 5.2 (P1):** "KRIs" is used as a primary navigation label with no definition anywhere in the authenticated UI. A CFO or board member would not know what KRIs are from the nav or the KRI page heading alone.

### 5.3 VytlRx Score Framing — PARTIAL

- `confirmation-screen.tsx` line 73: "Your VytlRx Score" shown with a number and grade — no business framing.
- `risk-pulse-widget.tsx` line 119: "Based on VytlRx Score" — minimal context.
- `reports-client.tsx` Executive Summary (line 188-189): "The organisation's current VytlRx Score is {n} (Grade X), reflecting a [strong/acceptable/moderate/challenged] risk posture" — this is the best plain-language framing, but it appears only in the Reports section.

**Finding 5.3 (P1):** The VytlRx Score is framed as a metric on the dashboard, not as a business health indicator. The best plain-language framing exists only in Reports. Dashboard framing is missed.

### 5.4 CFO-Repeatable Sentence — NOT PRESENT on Dashboard

There is no single summary sentence in the dashboard a user could read and repeat to their CFO. The closest candidate is in the Reports Executive Summary tab — not the dashboard.

**Finding 5.4 (P1):** A CEO cannot extract a shareable value statement from the dashboard alone. They must navigate to Reports > Executive Summary to find one.

### 5.5 Board Report Feature Prominence — PASS

"Reports" is in the sidebar nav. The `ConfirmationScreen` references it as a next step. The landing page features it as a primary benefit.

### 5.6 KRIs Explained in Plain Language — NOT in Authenticated UI

The KRIs page (`kris-client.tsx`) shows "Key Risk Indicators" as a heading with subtitle "Monitor and track key metrics for risk management" — functional but technical. Status labels (Healthy / Warning / Critical) are clear. What a KRI *is* and why it matters to a CFO is never explained in the authenticated app.

**Finding 5.6 (P2):** KRI functionality lacks a plain-language explanation in the authenticated UI.

---

## Dimension 6: Navigation and Error Handling

### 6.1 Navigation Structure — PASS with P1 note

Sidebar order: Dashboard, Workspace, Risks, Actions, KRIs, Reports, Team, Settings.

"Workspace" (a Kanban triage view) appears before "Risks" in the primary nav — this is counter-intuitive for a first-time user whose most important action is to add risks. Minor ordering concern, not a blocker.

**More significant:** Two navigation implementations coexist — `components/sidebar.tsx` (dark side rail) and `components/top-nav.tsx` (light top bar) — controlled by a `USE_TOP_NAV` feature flag in `lib/feature-flags.ts`. The two variants have different item sets:
- Sidebar: Dashboard, Workspace, Risks, Actions, KRIs, Reports, Team, Settings
- TopNav: Dashboard, Risks, Monitor (= KRIs), Reports, Settings (no Workspace, no Actions)
- Labels differ: "KRIs" (Sidebar) vs "Monitor" (TopNav)

**Finding 6.1 (P1):** Two navigation variants with different item sets and different labels exist behind a feature flag. Depending on which is deployed, users see either a different set of features or different labels for the same features.

### 6.2 Active Navigation Item — PASS

Both nav variants correctly highlight the active route. Sidebar uses `bg-teal-500/15 text-teal-400` with a teal dot for the active item. TopNav uses `bg-teal-500/10 text-teal-600 dark:text-teal-400`. Both use `pathname === item.href` comparison.

### 6.3 Help and Feature Discovery — PASS

Command palette (`components/command-palette.tsx`) is triggered by `Ctrl+K` / `Cmd+K` or a search button in the TopNav. It provides quick navigation to major sections, recent items, and risk search. This is a good discoverability mechanism for power users.

### 6.4 Error Handling — PASS

`app/error.tsx` renders a user-friendly "Something went wrong" screen with "Try Again" and "Go to Dashboard" buttons. `components/error-boundary.tsx` catches React render errors with a refresh button. Error details are shown only in `NODE_ENV === 'development'`. Production users get clean error messages. The risk form shows inline API error messages.

### 6.5 404 Page — PASS

`app/not-found.tsx` renders a 404 page with a "Go to Dashboard" link. Functional recovery path present.

### 6.6 Dead-End Navigation States — MINOR

The "Import Your Spreadsheet" option in `welcome-screen.tsx` line 95 navigates to `/risks?import=true`, exiting the onboarding wizard entirely. If the user cancels the import, they land on the Risks page with no risks and no score — they have bypassed onboarding without completing it, and onboarding does not resume.

**Finding 6.6 (P2):** The "Import Spreadsheet" path in the onboarding wizard is a one-way exit. Cancelled imports leave users on the Risks page with no onboarding context and no path back to the wizard.

### 6.7 Loading States — PASS

All data-fetching components implement loading states. Score cards show animated pulse skeletons. Stat cards have a `loading` prop. Risk table, heatmap, KRI list, and all widgets show spinners or skeleton placeholders. The reports client shows a `Loader2` spinner when `!dataReady`.

---

## Rename Audit

Searched all `.tsx` and `.ts` files in `src/` for user-visible instances of the old product name: "Vytl Score", "VytlScore", "vytl score", "vytlScore" in JSX text, aria-labels, HTML strings, and template literals. Internal variable names, function names, and code identifiers were excluded.

### User-Visible Old Name Found

| File | Line | User-Visible String |
|---|---|---|
| `src/lib/email-templates.ts` | 314 | `<p style="...">VYTL SCORE</p>` — HTML label in the weekly digest email sent to all active users |

### Confirmed Clean (Internal Identifiers Only — Not User-Visible)

The following use `vytlScore` or `VytlScore` as TypeScript identifiers (variable names, function names, prop names, interface fields) — these are correctly exempt:

| File | Context | Status |
|---|---|---|
| `lib/vytl-score.ts` | `calculateVytlScore()`, `VytlScoreResult`, `vytlScore` field | Internal — EXEMPT |
| `server/routers/assessment.ts` | `calculateVytlScore` import, `vytlScore` DB field | Internal — EXEMPT |
| `app/onboarding/onboarding-client.tsx` | `vytlScore` prop name | Internal — EXEMPT |
| `app/onboarding/confirmation-screen.tsx` | `vytlScore` prop name; rendered label is "Your VytlRx Score" ✓ | Internal — EXEMPT |
| `components/vytl-score-card.tsx` | Exported as `VytlScoreCard`; rendered label is "VytlRx Score" ✓ | Internal — EXEMPT |
| `components/vytl-score-card-compact.tsx` | Exported as `VytlScoreCardCompact`; rendered label is "VytlRx Score" ✓ | Internal — EXEMPT |
| `components/dashboard/widgets/vytl-score-widget.tsx` | Exported as `VytlScoreWidget`; rendered label is "VytlRx Score" ✓ | Internal — EXEMPT |
| `app/reports/reports-client.tsx` | `vytlScore`, `vytlGrade` are variable names; rendered text is "VytlRx Score" ✓ | Internal — EXEMPT |
| `lib/board-report.ts` | `vytlScore` TypeScript property on `BoardReportData` interface | Internal — EXEMPT |

**Summary: 1 user-visible instance of the old name, in the weekly digest email HTML template.**

---

## Prioritised Fix List

### P0 — Launch Blockers (fix before any user testing)

**P0-1: Trend Score Bug — 12/25 Baseline for New Orgs with No Assessment History**
- **Description:** New orgs that complete onboarding with industry template risks immediately see a score of 12/100. The trend dimension returns a hardcoded 12/25 when no prior assessment exists. The core value loop is broken from the first moment.
- **File:** `src/lib/vytl-score.ts` (lines 276-289) — change `score: 12` to `score: 0`; verify the `direction: 'insufficient_data'` state is displayed gracefully in score card components.
- **Effort:** S

**P0-2: "VYTL SCORE" Old Name in Weekly Digest Email**
- **Description:** The weekly digest email sent to all active users contains the pre-rename label "VYTL SCORE" in an HTML `<p>` tag.
- **File:** `src/lib/email-templates.ts` (line 314) — change "VYTL SCORE" to "VytlRx Score".
- **Effort:** S

**P0-3: "King V ready" in Onboarding Welcome Screen**
- **Description:** The first screen new users see after registration says "King V ready." The correct South African governance code is King IV. This is a factual error that immediately damages credibility with the target audience.
- **File:** `src/app/onboarding/welcome-screen.tsx` (line 140) — change "King V ready" to "King IV aligned."
- **Effort:** S

---

### P1 — Pre-Launch Fixes (required before user testing sessions begin)

**P1-1: VytlRx Score Does Not Auto-Refresh After Risk Creation**
- **Description:** Adding, editing, or deleting a risk does not invalidate the assessment query or trigger a score recalculation. The dashboard score is stale until the user manually clicks "Recalculate." This breaks the core feedback loop.
- **Files:** `src/server/routers/risk.ts` (add query invalidation or background recalculation on create/update/delete); score card components (ensure they react to the invalidated query).
- **Effort:** M

**P1-2: No Post-Creation Toast on Risk Add**
- **Description:** After creating a risk from the Risks page, the modal closes silently. No toast, no score-update notification. Users have no confirmation their risk was saved.
- **File:** `src/components/risk-form.tsx` — add `toast.success('Risk added successfully')` in the `onSuccess` callback.
- **Effort:** S

**P1-3: Risk Form Has 16 Fields — Overwhelming for First-Time Users**
- **Description:** The risk creation modal presents 16 fields with no clear separation of required vs optional. This is double the 8-field threshold and will cause abandonment on the first core action.
- **File:** `src/components/risk-form.tsx` — collapse optional fields (Financial Exposure, Root Cause, Control Description, Control Effectiveness, Owner, Due Date) behind an "Advanced options" toggle or progressive disclosure accordion.
- **Effort:** M

**P1-4: No Plain-Language Score Interpretation on Dashboard**
- **Description:** The score card shows a number and grade only. No sentence explains what that means for the user's business. The good plain-language framing (`strong / acceptable / moderate / challenged`) exists in Reports but not on the dashboard.
- **Files:** `src/components/vytl-score-card.tsx`, `src/components/vytl-score-card-compact.tsx`, `src/components/dashboard/widgets/vytl-score-widget.tsx` — add a one-line interpretation below the grade, reusing the score health logic from `reports-client.tsx`.
- **Effort:** S

**P1-5: "KRIs" Navigation Label Has No Explanation**
- **Description:** "KRIs" appears as a primary sidebar navigation label with no definition anywhere in the authenticated UI. A CFO or board member would not understand this acronym.
- **Files:** `src/components/sidebar.tsx` (add tooltip: "Key Risk Indicators — early warning metrics"); `src/app/kris/kris-client.tsx` (add descriptive subtitle to page header).
- **Effort:** S

**P1-6: Only 3 of 6 Marketed Industries Have Onboarding Templates**
- **Description:** The landing page implies full coverage for Financial Services, Mining, Healthcare, Manufacturing, Retail, and Technology. The onboarding wizard only offers Manufacturing, Financial Services, and Retail. Users in Mining, Healthcare, or Technology must select an irrelevant template.
- **Files:** `src/app/onboarding/industry-selector.tsx`, `src/lib/industry-templates.ts` — either create three additional 15-risk SA-contextual templates (L) or update the landing page copy to reflect only the three available industries (S).
- **Effort:** S (landing page fix) or L (full template creation)

---

### P2 — Polish (address after user testing, before commercial launch)

**P2-1: Two Navigation Variants with Different Item Sets**
- **Description:** `Sidebar` and `TopNav` have different nav labels ("KRIs" vs "Monitor") and different items (Actions and Workspace absent from TopNav) controlled by a feature flag. Whichever is deployed, the other is inaccessible.
- **Files:** `src/components/sidebar.tsx`, `src/components/top-nav.tsx`, `src/lib/feature-flags.ts` — align item sets and labels between both variants before determining which to ship.
- **Effort:** S

**P2-2: Risk Table Empty State Has No CTA**
- **Description:** `risk-table.tsx` line 177: "No risks found" with no button. Users who filter out all risks have no prompt to add one.
- **File:** `src/components/risk-table.tsx` — add an "Add your first risk" button to the empty state.
- **Effort:** S

**P2-3: No Tooltips on Risk Scoring Fields**
- **Description:** The risk form sliders for Inherent/Residual Likelihood and Impact have no explanation of the 1-5 scale or the difference between inherent and residual risk.
- **File:** `src/components/risk-form.tsx` — add tooltip icons with brief plain-language definitions on the scoring section headers.
- **Effort:** S

**P2-4: "Import Spreadsheet" in Onboarding Exits Wizard Without Recovery**
- **Description:** Clicking "Import Your Spreadsheet" in the onboarding welcome screen navigates away from the wizard. Users who cancel the import have no path back to onboarding.
- **File:** `src/app/onboarding/welcome-screen.tsx` — open the import modal in-place within the wizard, or surface a "Continue onboarding" banner on the risks page when triggered from onboarding.
- **Effort:** S

**P2-5: Inconsistent Empty States Across Dashboard Widgets**
- **Description:** Empty states vary in pattern and quality: some have icon + two descriptive lines, some have a single line of muted text, some use positive "all clear" framing. No shared component or consistent copy pattern.
- **Files:** All widget files in `src/components/dashboard/widgets/` — create a shared `EmptyState` component with icon, heading, description, and optional CTA, and apply it uniformly.
- **Effort:** M

---

*End of report.*
