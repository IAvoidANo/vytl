# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vytl is an AI-powered risk management SaaS for South African businesses. Multi-tenant architecture with POPIA compliance features.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **API**: tRPC v11 with Zod validation
- **Database**: PostgreSQL (Supabase) via Prisma ORM
- **Auth**: NextAuth.js v5 (beta) with Credentials provider + JWT sessions
- **AI**: Anthropic SDK for risk analysis
- **Storage**: AWS S3 for file uploads

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Run Vitest tests
npm run test:ui      # Run Vitest with UI
npx prisma studio    # Database GUI
npx prisma migrate dev   # Run migrations
npx prisma db seed   # Seed test data (admin@acme.com / Password123!)
```

## Architecture

### Authentication Flow
- NextAuth configured in `src/lib/auth.ts` with PrismaAdapter
- JWT tokens include: `id`, `role`, `orgId`
- Protected pages pattern:
```typescript
const session = await auth()
if (!session?.user) redirect('/login')
// Access: session.user.id, session.user.role, session.user.orgId
```

### Database Access
- Prisma client singleton exported as `db` from `src/lib/db.ts`
- **All queries must be scoped to user's orgId** for multi-tenancy

### tRPC Setup
- Context in `src/lib/trpc.ts` extracts session via `auth()`
- `publicProcedure` - no auth required
- `protectedProcedure` - requires authenticated user, provides `ctx.user`
- Routers defined in `src/server/routers/`

## Data Model Concepts

### Three-Tier Risk Scoring Architecture

**Tier 1 — Risk-Level (per risk):**
- **Inherent Score**: Raw risk before controls (likelihood × impact, scale 1-5 each)
- **Control Effectiveness**: EFFECTIVE, PARTIALLY_EFFECTIVE, INEFFECTIVE, NOT_TESTED (default), NOT_APPLICABLE
- **Residual Score**: Risk after controls applied (likelihood × impact)
- **Value at Risk (VaR)**: `financialExposure × (residualLikelihood / 5)` — stored as Prisma Decimal(15,2)

**Tier 2 — Intelligence Overlays (contextual signals):**
- **Velocity**: Rate of score change over time via audit history
- **KRI Alignment**: Active KRI status distribution (GREEN/AMBER/RED)
- **Correlation**: Cross-risk category concentration and high-risk density
- **Control Quality**: Depth/specificity of documented controls

**Tier 3 — Organisation-Level:**
- **Vytl Score (0-100)**: Org-wide score from `assessment.current` (stored DB record)
- Letter grades: A (80+), B (60-79), C (40-59), D (20-39), F (0-19)
- Staleness: badge shown when assessment > 30 days old

**Canonical Sort**: residualScore DESC → varValue DESC (nulls last) → inherentScore DESC → createdAt DESC

### Scoring Engine (Sprint 9)
- **Composite Score (0-100)**: 5 weighted dimensions via `ScoringProfile`
  - Base (40%): Normalized L×I
  - Control Quality (20%): Analysis of control depth, specificity, structure
  - Velocity (15%): Rate of score change via audit log history
  - Correlation (15%): Cross-risk category concentration and high-risk density
  - KRI Alignment (10%): Active KRI status trends
- **Custom Rules**: `ScoringRule` applies score modifiers based on conditions
- **Industry Profiles**: Pre-configured weights for financial_services, mining_resources, technology, healthcare, manufacturing, retail
- **SA Regulatory Factors**: King V, POPIA, B-BBEE, NCA, FICA
- **Score History**: Per-risk score snapshots in `ScoreHistory` for trend analysis
- **Recommendations**: Auto-detect under/over-scored risks, missing categories, KRI gaps, inconsistencies

### Risk Fields
- `rootCause`: Optional text field for root cause analysis
- `isOngoing`: Boolean flag for ongoing monitoring (no due date)
- `controls`: Mitigation controls (can be populated from AI analysis)
- `aiAnalysis`: One-to-one relation with AI-generated insights
- `controlEffectiveness`: Enum field (5 values, defaults NOT_TESTED)
- `financialExposure`: Decimal(15,2) for VaR calculation
- `varValue`: Decimal(15,2), computed server-side — router maps `.toString()` for tRPC transport

### Risk Sources
- `MANUAL`: User-entered
- `EMAIL`: Parsed from email submissions
- `EXCEL`: Bulk imported
- `API`: External integrations

### Workflow Status (Kanban)
- `INBOX`: Newly received risks awaiting triage
- `TRIAGE`: Under review for categorization/scoring
- `ASSIGNED`: Assigned to risk owner for action
- `APPROVED`: Fully reviewed and approved

### User Roles (hierarchical)
`OWNER` > `ADMIN` > `RISK_MANAGER` > `EDITOR` > `VIEWER`

## Environment Variables

```
DATABASE_URL=        # Supabase pooled connection (port 6543, ?pgbouncer=true)
DIRECT_URL=          # Supabase session connection (port 5432)
NEXTAUTH_SECRET=     # JWT signing secret
NEXTAUTH_URL=        # Base URL (http://localhost:3000)
ANTHROPIC_API_KEY=   # Claude API key for AI document extraction
```

## Conventions

- Organisation-scoped: Every entity links to an `orgId`
- Audit logging: Track entity changes with IP/userAgent
- South African compliance: POPIA data retention settings on Organisation model
- Prisma Decimal serialization: Router maps `r.varValue?.toString() ?? null` for tRPC transport
- Validation pattern: Extract Zod schemas + pure functions into `*-validation.ts` files, test those

## Sprint Status

### Sprint 1 - COMPLETE
- [x] Database connection (Supabase PostgreSQL)
- [x] Authentication (NextAuth v5 Credentials)
- [x] Login page, logout, auth redirects
- [x] App layout with sidebar + header

### Sprint 2 - COMPLETE
- [x] tRPC API routes (`/api/trpc`)
- [x] Risk CRUD (list, get, create, update, delete)
- [x] Risk Register table with sorting
- [x] Risk form with scoring sliders

### Sprint 3 - COMPLETE
- [x] Risk filtering (category, status)
- [x] Risk detail page with 5-tab layout (`/risks/[id]`)
- [x] Risk heatmap (5×5 likelihood vs impact matrix)
- [x] Table/Heatmap view toggle

### Sprint 4 - COMPLETE
- [x] KRI monitoring dashboard with table/card view toggle
- [x] KRI table with sortable columns and inline value editing
- [x] Excel/CSV import for bulk risk creation with column mapping
- [x] Audit logging for risk create/update/delete operations
- [x] Audit timeline UI in risk detail History tab
- [x] Smart field mapping with pattern-based auto-detection
- [x] PDF document support (pdf-parse)
- [x] Word document support (mammoth)
- [x] Claude AI extraction for unstructured documents
- [x] Enhanced validation preview (green/amber/red rows)
- [x] Combined L×I column support (parse "3,4", "3x4", "3/4" formats)
- [x] Intelligent header row detection (handles title rows above headers)
- [x] Downloadable Excel import template with 10 sample risks

### Sprint 5 - COMPLETE
- [x] AI Risk Analysis in detail page (Claude API)
  - "Analyse with AI" button triggers Claude analysis
  - Executive summary (2-3 sentences)
  - Suggested controls (3-5 recommendations)
  - Score justification (likelihood, impact, overall)
  - Related risk categories
  - Suggested KRIs to monitor
  - Confidence score display
  - Regeneration support
  - **Apply to Risk** functionality with edit modals
- [x] Dashboard upgrades - compact single-screen layout (1080p optimized)
  - VytlScoreCard with score breakdown and trend
  - RiskPulse animated indicator
  - Top 5 risks widget, Activity feed (10 items), Category donut chart
  - Quick Actions bar for new user onboarding
- [x] Vytl Score calculation (4 dimensions × 25 pts each)
- [x] Letter grades: A (80+), B (60-79), C (40-59), D (20-39), F (0-19)
- [x] Due Date "Ongoing" option (isOngoing checkbox)
- [x] Root Cause field added to Risk model
- [x] App footer with Vytl branding

### Sprint 6 - COMPLETE (Beta Readiness)
- [x] **RBAC Enforcement** - Role-based procedures (editorProcedure, riskManagerProcedure, adminProcedure, ownerProcedure)
  - VIEWER: Read-only access
  - EDITOR: Can create/edit risks, import documents
  - RISK_MANAGER: Can delete risks, manage KRIs, run AI analysis
  - ADMIN: Can manage users, organisation settings
  - OWNER: Full access including user deletion
- [x] **User Management** - Complete invite system with role assignment
  - Invite users with token-based activation (7-day expiry)
  - Role assignment UI with dropdown selector
  - User enable/disable functionality
  - User deletion (OWNER only)
  - Accept invite page (/accept-invite)
- [x] **Password Reset** - Token-based password recovery
  - Forgot password page (/forgot-password)
  - Reset password page (/reset-password)
  - 1-hour token expiry
  - Rate limited (10 requests per 15 minutes)
- [x] **Settings Page** - Full settings with tabs
  - Profile tab: Name editing
  - Security tab: Password change
  - Organisation tab (ADMIN+): Org name, industry, employee count
  - POPIA tab (ADMIN+): Data retention settings, consent management
- [x] **Rate Limiting** - In-memory rate limiting
  - AI analysis: 10 requests/minute
  - Document import: 5 requests/minute
  - Password reset: 10 requests/15 minutes
- [x] **Error Handling** - Comprehensive error UI
  - Global ErrorBoundary component
  - Next.js error.tsx page
  - 404 not-found.tsx page
  - Toast notifications via Sonner
- [x] **Audit Improvements** - IP/userAgent tracking
  - Extracted from request headers in tRPC context
  - Passed to all createAuditLog calls

### Sprint 7 - COMPLETE (UX & Adoption Enhancements)
- [x] **Command Palette** (Cmd+K / Ctrl+K)
  - Quick navigation to all pages
  - Risk search with refCode and title matching
  - Quick actions: Create Risk, Create KRI, Import Risks
  - Recent items tracking (localStorage)
  - cmdk library integration
- [x] **Proactive AI Suggestions in Risk Form**
  - Auto-suggest category as user types description (50+ chars)
  - Suggest likelihood/impact scores with reasoning tooltip
  - "AI suggests: [Category] | L:[1-5] I:[1-5]" banner below description
  - Tab key to accept suggestions
  - Apply button with visual feedback
  - Debounced API calls (500ms) to reduce load
- [x] **Sparklines in Risk Table**
  - Mini SVG trend charts showing score history
  - Color-coded: green (improving), red (worsening), gray (stable)
  - Data extracted from audit log score changes
  - 30-day trend window
- [x] **Bento Grid Dashboard**
  - Draggable, resizable widgets using react-grid-layout
  - Lock/Unlock toggle for customization mode
  - Layout persistence in localStorage
  - Reset to default layout button
  - Responsive grid (12/8/4 columns based on viewport)

### Sprint 8 - COMPLETE (Workspace & Theming)
- [x] **Risk Workspace** - Kanban board for risk workflow management
  - Drag-and-drop between columns: Inbox → Triage → Assigned → Approved
  - Source filtering (Manual, Email, Import, API)
  - Email forward modal (UI ready for future email ingestion)
  - @dnd-kit/core integration for smooth drag interactions
  - Real-time workflow status updates
- [x] **Theme Toggle** - Dark/Light mode support
  - ThemeProvider context with localStorage persistence
  - System preference detection on first visit
  - Toggle button in header
  - CSS class-based theming (dark/light on html element)
- [x] **Modular Dashboard Widgets**
  - WidgetWrapper component for consistent styling
  - StatWidget, TopRisksWidget, ActivityFeedWidget
  - CategoryChartWidget, VytlScoreWidget, RiskPulseWidget
  - StatusBreakdownWidget for workflow status distribution
- [x] **Testing Infrastructure**
  - Vitest setup with React Testing Library
  - Happy-DOM for browser environment simulation
  - Test commands: `npm run test`, `npm run test:ui`
- [x] **Schema Updates**
  - `workflowStatus` field on Risk model (INBOX, TRIAGE, ASSIGNED, APPROVED)
  - `dashboardLayout` JSON field on User for persisted widget layouts
- [x] **Session Templates** - Development documentation

### Sprint 9 - COMPLETE (Scoring Engine)
- [x] **Scoring Engine** - 5-dimension composite risk scoring (0-100)
- [x] **Scoring Profiles** - Configurable per-org scoring configuration
- [x] **Custom Scoring Rules** - Condition-based score modifiers
- [x] **Industry Profiles** - 6 SA industry presets
- [x] **Score Trends** - Historical analysis with moving averages, anomaly detection, forecasting
- [x] **Scoring Recommendations** - Automated insights (under/over-scored, missing categories, KRI gaps)
- [x] **Prisma Models** - ScoringProfile, ScoringRule, ScoreHistory
- [x] **tRPC Router** - `scoring.*` with 14 endpoints (RBAC enforced)
- [x] **Tests** - 83 new tests

### Sprint 10 - COMPLETE (Scoring Engine UI)
- [x] **Settings > Methodology Tab** (ADMIN+, read-only)
  - Three-tier methodology panel (Tier 1: Risk-Level, Tier 2: Intelligence Overlays, Tier 3: Vytl Score)
  - Engine status display
  - Previously interactive scoring config — now read-only (Phase B refactor)
- [x] **Risk Detail > Risk Intelligence Tab**
  - ISO 31000 summary grid (inherent, residual, control effectiveness, VaR)
  - Intelligence overlay cards (velocity, KRI, correlation, control quality)
  - "Run Analysis" button (scoring.calculate mutation)
  - Score history, methodology footer
- [x] **Dashboard Scoring Widgets**
  - Risk Intelligence Alerts: top recommendations with severity badges
  - CategoryTrendsWidget: category scores with trend direction arrows

### Sprint 11 - COMPLETE (Board Report, Treatment Plans, Multi-Register)
- [x] **Board Report PDF Export** - Multi-page governance report (jsPDF)
  - Cover page, exec summary, risk overview, top 10 (with VaR column), heatmap, trends, recommendations, KRI status
  - BoardReportModal with section readiness checklist
  - "Board Report" button on dashboard
  - 12 tests
- [x] **Risk Treatment Plans** - Action items per risk
  - TreatmentAction model: title, description, priority (LOW-CRITICAL), status (OPEN-CANCELLED), dueDate, assignee
  - tRPC treatment router: CRUD + stats (RBAC enforced, audit logged)
  - TreatmentActions UI component with progress bar, inline form, status cycling
  - 28 tests
- [x] **Multi-Register Support** - Multiple risk registers per org
  - Register CRUD router (ADMIN+, audit logged, delete safety checks)
  - Settings > Registers tab with create/edit/delete
  - Register selector in risk form, register filter on risk list + workspace
  - 27 tests

### Sprint 12 - COMPLETE (Regulatory Mapping)
- [x] **Static Framework Data** - King V (35 requirements, 13 principles) + ISO 31000:2018 (16 requirements)
- [x] **Validation Schemas** - Zod schemas + pure coverage calculation functions
- [x] **Prisma Schema** - ComplianceStatus enum, RegulatoryMapping model with unique constraint
- [x] **tRPC Router** - 7 endpoints: list, create, bulkCreate, update, delete, coverage, riskCoverage
- [x] **Compliance Tab** - 7th tab in risk detail with coverage bars, status cycling, bulk add panel
- [x] **Dashboard Widget** - ComplianceCoverageWidget with per-framework progress bars
- [x] **Tests** - 50 new tests

### Sprint 13 - COMPLETE (Risk Appetite Configuration)
- [x] **Risk Appetite** - Configurable L×I threshold bands replacing hardcoded 4/9/14
  - Organisation model fields: appetiteStatement, appetiteLow/Medium/High, appetiteCategoryConfig
  - appetite.ts router: get, update (audit logged), breachSummary
  - useAppetite hook: shared React Query cache across all UI components
  - Settings > Risk Appetite tab: statement, thresholds, per-category overrides
  - Updated: RiskScoreBadge, RiskHeatmap, TopRisksWidget, KanbanCard, RiskTable
  - AppetiteBreachWidget on dashboard
  - 50 new tests

### Sprint 15 - COMPLETE (Movement & Trends + Report Improvements)
- [x] **Risk Snapshots** — Temporal portfolio capture
  - Prisma: `RiskSnapshot`, `RiskSnapshotDetail` models; `SnapshotType`, `SnapshotFrequency` enums
  - Organisation fields: `snapshotFrequency` (WEEKLY/MONTHLY), `snapshotMateriality` (±N pts)
  - `snapshot-validation.ts`: pure functions (buildSeverityCounts, buildKriCounts, detectRiskMovers, etc.)
  - `snapshot-utils.ts`: captureSnapshot, hasBaselineSnapshot, getEarliestSnapshotDate
  - Auto-baseline on first risk creation; weekly Vercel Cron (Sundays 2am UTC, CRON_SECRET protected)
- [x] **Snapshots tRPC Router** — 6 procedures (capture, list, getById, checkDataAvailability, compare, delete)
- [x] **Settings → Snapshots tab** — Frequency config, materiality threshold, manual capture, history list
- [x] **Movement & Trends tab** (8th Reports tab) — Period selector (3/6/12M), Vytl Score trajectory, risk movers (increased/decreased/new/closed), KRI breach patterns, treatment velocity, category evolution
- [x] **MovementAlertWidget** — Optional dashboard widget (`src/components/dashboard/movement-alert-widget.tsx`)
- [x] **Tests** — 43 new tests (26 pure function + 17 router logic), 890 total passing
- [x] **Report Executive Summaries** — Data-driven narrative paragraphs on all 8 report tabs
- [x] **Consistent Score Badges** — `bandToBadgeClasses()` applied to Top 10 score + Category Trends avg score
- [x] **Heatmap fixes** — Tailwind content path (`src/lib/**/*.ts`) added; critical-band red cells restored; count badges as white pills on solid-colour cells
- [x] **appetite-validation.ts** — Added `bandToLightHeatmapClasses`, `bandToBadgeClasses` helpers

### Sprint 14 - COMPLETE (Incident Linking)
- [x] **Incident Model** - Track materialised risk events
  - Prisma: Incident model with IncidentSeverity + IncidentStatus enums
  - Relations: Risk (cascade delete), User (reportedBy + assignee)
  - 5-status lifecycle: OPEN → INVESTIGATING → CONTAINED → RESOLVED → CLOSED
  - resolvedAt auto-set when status transitions to RESOLVED/CLOSED
- [x] **Validation** (`incident-validation.ts`)
  - Zod schemas: createIncidentSchema, updateIncidentSchema
  - Pure functions: getResolvedAtForStatus, sortBySeverity, getNextStatus
  - Constants: labels, colors, STATUS_CYCLE for all enums
- [x] **tRPC Router** (`incident.ts`) with 5 endpoints (list, create, update, delete, stats)
  - Org-scoped via risk → register → orgId chain, audit logged
- [x] **Incidents Tab** - 8th tab in risk detail (AlertOctagon icon)
  - IncidentLinks component: stats bar, inline form, incident cards with status cycling
- [x] **Testing** - 41 new tests

### Scoring Architecture Refactor - Phase A COMPLETE
- [x] **Prisma Schema** - Added controlEffectiveness enum + field (default NOT_TESTED), financialExposure Decimal(15,2), varValue Decimal(15,2) to Risk model
- [x] **Risk Router** - VaR auto-calculation on create/update, Decimal→string serialization, canonical sort order
- [x] **Assessment Router** - Stored assessment pattern (assessment.current reads DB, assessment.create recalculates)
- [x] **Tests** - 27 new Phase A tests (794 total)

### Scoring Architecture Refactor - Phase B COMPLETE
- [x] **ControlEffectivenessBadge** - New component with 5-value colour-coded badges, compact mode
  - Applied in: risk-detail-client, risk-table, kanban-card, top-risks-widget, risk-heatmap
- [x] **VaR Display** - Formatted as "R X,XXX" (ZAR currency) across 5 locations
  - risk-detail-client (overview), risk-table (new column), top-risks-widget, board-report PDF, reports-client
- [x] **Risk Intelligence Panel** - Renamed Scoring tab → "Risk Intelligence"
  - ISO 31000 summary grid, intelligence overlay cards, methodology footer
- [x] **Settings > Methodology** - Read-only three-tier methodology panel (was interactive Scoring config)
- [x] **Vytl Score Staleness** - Badge when assessment > 30 days old
- [x] **Widget Rename** - "Scoring Recommendations" → "Risk Intelligence Alerts"
- [x] **Copy Audit** - Removed deprecated terms (Composite Score, Scoring Engine Configuration, Calculate Score)
- [x] **Tests** - 19 new Phase B tests (813 total across 23 files, all passing)

### Pages
| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ | Auth redirect |
| `/login` | ✅ | Login form with forgot password link |
| `/dashboard` | ✅ | Bento grid dashboard with draggable widgets + Board Report |
| `/risks` | ✅ | Risk register (table/heatmap) with sparklines + register filter |
| `/risks/[id]` | ✅ | Risk detail (8 tabs: Overview, AI Analysis, Treatment, Compliance, Incidents, Risk Intelligence, History, Documents) |
| `/workspace` | ✅ | Kanban board with quick actions (edit, assign, approve, reject, archive, delete) |
| `/reports` | ✅ | Board governance reports with 8 tabs + executive summaries + print support |
| `/users` | ✅ | Team management (ADMIN+) |
| `/settings` | ✅ | Profile, Security, Organisation, POPIA Compliance, Methodology, Registers, Risk Appetite, Snapshots |
| `/forgot-password` | ✅ | Password reset request |
| `/reset-password` | ✅ | Password reset with token |
| `/accept-invite` | ✅ | Accept user invitation |

### Key Components
- `RiskTable` - Sortable table with filters, sparklines, Controls column, VaR column
- `RiskForm` - Create/edit modal with scoring + AI suggestions + register selector
- `RiskHeatmap` - 5×5 matrix visualization with CE tooltips
- `RiskScoreBadge` - Color-coded score display (appetite-aware)
- `ControlEffectivenessBadge` - 5-value colour-coded badge with compact mode (Phase B)
- `AppLayout` / `Sidebar` / `Header` - Layout system (Sidebar shows Team link for ADMIN+)
- `CommandPalette` - Cmd+K quick navigation and search
- `DashboardGrid` - Draggable bento grid with react-grid-layout
- `Sparkline` - SVG mini line chart for trends
- `KriTable` - KRI list with status indicators and inline editing
- `KriForm` - Create/edit KRI with threshold configuration
- `ExcelImportModal` - Multi-format import (Excel/CSV/PDF/Word) with AI extraction
- `ErrorBoundary` - Global error boundary for React errors
- `Providers` - App providers with ErrorBoundary, tRPC, QueryClient, Session, Toaster, ThemeProvider
- `AuditTimeline` - Change history display for entities
- `VytlScoreCard` - Animated score display with grade and breakdown
- `VytlScoreCardCompact` - Compact version of score display
- `RiskPulse` - Visual heartbeat indicator (green/amber/red based on score)
- `TopRisks` - Top 5 highest-risk items widget
- `ActivityFeed` - Recent audit log activity with user/action/timestamp
- `CategoryChart` - SVG donut chart showing risk distribution by category
- `ThemeToggle` - Dark/light mode toggle button
- `WorkspaceClient` - Kanban board with drag-and-drop
- `KanbanColumn` / `KanbanCard` - Workspace drag-and-drop with quick actions + CE badge
- `WidgetWrapper` - Consistent dashboard widget container
- Dashboard Widgets: StatWidget, TopRisksWidget (with VaR + CE), ActivityFeedWidget, CategoryChartWidget, VytlScoreWidget (with staleness), RiskPulseWidget, StatusBreakdownWidget, Risk Intelligence Alerts, CategoryTrendsWidget, ComplianceCoverageWidget, AppetiteBreachWidget
- `BoardReportModal` - PDF generation modal with data readiness checklist
- `TreatmentActions` - Treatment action list with progress bar and inline form
- `RegulatoryMappings` - Compliance tab: coverage bars, status cycling, bulk add
- `ComplianceCoverageWidget` - Dashboard widget: per-framework coverage bars
- `AppetiteSettings` - Risk appetite configuration component
- `IncidentLinks` - Incidents tab: stats bar, inline form, incident cards with status cycling
- `CreateRegisterModal` - Register creation modal
- `MovementTrendsTab` - Reports Movement & Trends tab: period selector, score trajectory, risk movers, KRI breach, treatment velocity
- `SnapshotSettings` - Settings Snapshots tab: frequency, materiality, manual capture, history
- `MovementAlertWidget` - Optional dashboard widget: shows material risk movements since last snapshot
- `DashboardHeatmap` - Dashboard heatmap: solid band colours, count badges, appetite-aware legend

### Import Template
Download: `/templates/risk-import-template.xlsx`
- 10 sample risks across all categories
- Instructions sheet with column descriptions
- Regenerate with: `npx tsx scripts/generate-import-template.ts`

### File Structure
```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth handler
│   │   ├── trpc/[trpc]/route.ts          # tRPC endpoint
│   │   ├── parse-document/route.ts       # PDF/Word parsing
│   │   └── cron/snapshot/route.ts        # Vercel Cron — weekly snapshot capture (CRON_SECRET)
│   ├── dashboard/page.tsx
│   ├── login/page.tsx
│   ├── risks/
│   │   ├── page.tsx, risks-client.tsx
│   │   └── [id]/page.tsx, risk-detail-client.tsx
│   ├── kris/
│   │   └── page.tsx, kris-client.tsx
│   ├── workspace/                        # Risk workflow kanban
│   │   └── page.tsx, workspace-client.tsx
│   ├── reports/                          # Board governance reports
│   │   └── page.tsx, reports-client.tsx
│   ├── users/
│   │   └── page.tsx, users-client.tsx    # Team management
│   ├── settings/
│   │   └── page.tsx, settings-client.tsx # 7 tabs: Profile, Security, Org, POPIA, Methodology, Registers, Appetite
│   ├── accept-invite/page.tsx            # User invite acceptance
│   ├── forgot-password/page.tsx          # Password reset request
│   ├── reset-password/page.tsx           # Password reset with token
│   ├── error.tsx                         # Global error page
│   └── not-found.tsx                     # 404 page
├── components/
│   ├── app-layout.tsx, sidebar.tsx, header.tsx
│   ├── risk-table.tsx, risk-form.tsx, risk-heatmap.tsx
│   ├── risk-score-badge.tsx, providers.tsx
│   ├── control-effectiveness-badge.tsx   # 5-value CE badge (Phase B)
│   ├── command-palette.tsx              # Cmd+K navigation
│   ├── dashboard-grid.tsx               # Bento grid layout
│   ├── sparkline.tsx                    # SVG trend charts
│   ├── theme-toggle.tsx                 # Dark/light mode toggle
│   ├── kri-table.tsx, kri-form.tsx
│   ├── excel-import-modal.tsx
│   ├── audit-timeline.tsx
│   ├── vytl-score-card.tsx
│   ├── vytl-score-card-compact.tsx
│   ├── error-boundary.tsx               # React error boundary
│   ├── board-report-modal.tsx           # PDF report generation modal
│   ├── treatment-actions.tsx            # Treatment action list + form
│   ├── regulatory-mappings.tsx          # Compliance tab component
│   ├── create-register-modal.tsx        # Register creation modal
│   ├── appetite-settings.tsx            # Risk appetite config component
│   ├── incident-links.tsx               # Incident list + form component
│   ├── movement-trends-tab.tsx          # Reports Movement & Trends tab
│   ├── snapshot-settings.tsx            # Settings Snapshots tab
│   ├── dashboard/
│   │   ├── risk-pulse.tsx, top-risks.tsx
│   │   ├── activity-feed.tsx, category-chart.tsx
│   │   ├── widget-wrapper.tsx           # Widget container
│   │   ├── widgets/
│   │   │   ├── stat-widget.tsx
│   │   │   ├── top-risks-widget.tsx     # With VaR + CE display
│   │   │   ├── activity-feed-widget.tsx
│   │   │   ├── category-chart-widget.tsx
│   │   │   ├── vytl-score-widget.tsx    # With staleness indicator
│   │   │   ├── risk-pulse-widget.tsx
│   │   │   ├── status-breakdown-widget.tsx
│   │   │   ├── scoring-recommendations-widget.tsx  # "Risk Intelligence Alerts"
│   │   │   ├── category-trends-widget.tsx
│   │   │   ├── compliance-coverage-widget.tsx
│   │   │   ├── appetite-breach-widget.tsx
│   │   │   └── index.ts
│   │   ├── movement-alert-widget.tsx    # Optional: material risk movements since last snapshot
│   │   └── index.ts
│   ├── workspace/                       # Kanban components
│   │   ├── kanban-column.tsx
│   │   ├── kanban-card.tsx              # With CE badge
│   │   └── email-forward-modal.tsx
│   ├── risks/                           # Risk sub-components
│   └── ui/                              # Shared UI primitives
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── db.ts            # Prisma client
│   ├── trpc.ts          # tRPC server setup + RBAC procedures
│   ├── trpc-client.ts   # tRPC React client
│   ├── audit.ts         # Audit logging (entities: RISK, KRI, USER, ORG, REGISTER, TREATMENT, REGULATORY, APPETITE, INCIDENT)
│   ├── rate-limit.ts    # In-memory rate limiting
│   ├── use-debounce.ts  # Debounce hooks for AI suggestions
│   ├── recent-items.ts  # Recent items localStorage tracking
│   ├── theme-context.tsx         # Theme provider context
│   ├── vytl-score.ts            # Vytl Score calculation (4 dimensions)
│   ├── scoring-engine.ts        # 5-dimension composite scoring engine
│   ├── scoring-validation.ts    # Zod schemas for scoring inputs
│   ├── scoring-recommendations.ts # Auto-generated scoring insights
│   ├── score-trends.ts          # Trend analysis + forecasting
│   ├── industry-profiles.ts     # SA industry scoring presets
│   ├── board-report.ts          # Board report PDF generation (with VaR column)
│   ├── treatment-validation.ts  # Treatment action Zod schemas
│   ├── register-validation.ts   # Register Zod schemas + delete guards
│   ├── regulatory-frameworks.ts  # Static King V + ISO 31000 framework data
│   ├── regulatory-validation.ts  # Regulatory mapping schemas + coverage calc
│   ├── appetite-validation.ts   # Risk appetite schemas + threshold classification + heatmap colour helpers
│   ├── use-appetite.ts          # Shared appetite hook for UI components
│   ├── incident-validation.ts   # Incident schemas + severity sort + status cycle
│   ├── snapshot-validation.ts   # Snapshot pure functions (buildSeverityCounts, detectRiskMovers, etc.)
│   ├── snapshot-utils.ts        # captureSnapshot, hasBaselineSnapshot, getEarliestSnapshotDate
│   └── risk-colour-mapping.ts   # Canonical L×I → colour mapping (getRiskColour, BAND_PRINT_COLOURS)
└── server/routers/
    ├── index.ts         # Root router (16 sub-routers)
    ├── risk.ts          # Risk CRUD + bulkCreate + stats + topRisks + workspace + VaR calc
    ├── kri.ts           # KRI CRUD + status calc
    ├── audit.ts         # Audit log queries + recent activity
    ├── assessment.ts    # Vytl Score: assessment.current (stored) + assessment.create (recalc)
    ├── ai-analysis.ts   # Claude AI risk analysis (rate limited)
    ├── import.ts        # AI document extraction (rate limited)
    ├── user.ts          # User management + password reset
    ├── organisation.ts  # Org settings + POPIA
    ├── scoring.ts       # Scoring engine API (14 endpoints)
    ├── treatment.ts     # Treatment action CRUD
    ├── register.ts      # Risk register CRUD
    ├── regulatory.ts    # Regulatory mapping CRUD + coverage
    ├── appetite.ts      # Risk appetite config + breach summary
    ├── incident.ts      # Incident CRUD + stats
    └── snapshots.ts     # Snapshot CRUD + compare + checkDataAvailability

tests/                                   # 890 tests across 26 files (all passing)
├── setup.ts
├── e2e/
│   └── user-journeys.test.ts
├── integration/
│   └── data-integrity.test.ts
├── server/routers/
│   ├── risk.test.ts
│   ├── assessment.test.ts
│   └── snapshots.test.ts                # Sprint 15 — router logic tests
└── utils/
    ├── scoring-engine.test.ts
    ├── scoring-validation.test.ts
    ├── industry-profiles.test.ts
    ├── score-trends.test.ts
    ├── board-report.test.ts
    ├── treatment-actions.test.ts
    ├── register-validation.test.ts
    ├── regulatory-frameworks.test.ts
    ├── regulatory-validation.test.ts
    ├── appetite-validation.test.ts
    ├── incident-validation.test.ts
    ├── snapshot-validation.test.ts      # Sprint 15 — pure function tests
    ├── phase-a-scoring.test.ts          # Scoring Architecture Phase A
    ├── phase-b-scoring-ui.test.ts       # Scoring Architecture Phase B
    ├── risk-scoring.test.ts
    ├── vytl-score.test.ts
    ├── kri-status.test.ts
    ├── audit-trail.test.ts
    ├── multi-tenancy.test.ts
    └── permissions.test.ts

.session-templates/                      # Dev documentation
├── api-routes.md
├── data-model.md
└── common-patterns/

public/templates/
└── risk-import-template.xlsx  # Downloadable import template

scripts/
└── generate-import-template.ts  # Regenerate Excel template
```

## Maintenance Instructions

After completing any sprint or significant feature:
1. Update the Sprint Status section in this file
2. Ensure schema.prisma comments reflect any new models or enums
3. Update the Pages table and Key Components list
4. Update the File Structure tree with any new files
5. Update the test count in the tests section header comment
6. Run `npm run build` to confirm clean build before closing out
