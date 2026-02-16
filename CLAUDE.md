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

### Risk Scoring
- **Inherent**: Raw risk before controls (likelihood × impact)
- **Residual**: Risk after controls applied
- Scale: 1-5 for likelihood and impact

### Scoring Engine (Sprint 9)
- **Composite Score (0-100)**: 5 weighted dimensions via `ScoringProfile`
  - Base (40%): Normalized L×I
  - Control Quality (20%): Depth/specificity of documented controls
  - Velocity (15%): Rate of score change over time
  - Correlation (15%): Connectedness to other high-scoring risks
  - KRI Alignment (10%): KRI status trends
- **Custom Rules**: `ScoringRule` applies score modifiers based on conditions (e.g., category=COMPLIANCE → +5)
- **Industry Profiles**: Pre-configured weights for financial_services, mining_resources, technology, healthcare, manufacturing, retail
- **SA Regulatory Factors**: King V, POPIA, B-BBEE, NCA, FICA
- **Score History**: Per-risk score snapshots in `ScoreHistory` for trend analysis
- **Recommendations**: Auto-detect under/over-scored risks, missing categories, KRI gaps, inconsistencies

### Risk Fields
- `rootCause`: Optional text field for root cause analysis
- `isOngoing`: Boolean flag for ongoing monitoring (no due date)
- `controls`: Mitigation controls (can be populated from AI analysis)
- `aiAnalysis`: One-to-one relation with AI-generated insights

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
  - API routes reference
  - Data model documentation
  - Common patterns (tRPC endpoints, client components, server pages)

### Sprint 9 - COMPLETE (Scoring Engine)
- [x] **Scoring Engine** - 5-dimension composite risk scoring (0-100)
  - Base Score (40%): Normalized residual L×I
  - Control Quality (20%): Analysis of control depth, specificity, structure
  - Velocity (15%): Rate of score change via audit log history
  - Correlation (15%): Cross-risk category concentration and high-risk density
  - KRI Alignment (10%): Active KRI status distribution (GREEN/AMBER/RED)
- [x] **Scoring Profiles** - Configurable per-org scoring configuration
  - Dimension weight customization (must sum to 100)
  - Category importance multipliers (0.1-3.0x)
  - Risk threshold configuration (low/medium/high)
- [x] **Custom Scoring Rules** - Condition-based score modifiers
  - 10 condition fields × 7 operators
  - Score modifiers: -25 to +25 (absolute or percentage)
  - Priority ordering (1-100)
- [x] **Industry Profiles** - 6 SA industry presets
  - Financial Services, Mining & Resources, Technology, Healthcare, Manufacturing, Retail
  - SA regulatory framework integration (King V, POPIA, B-BBEE, NCA, FICA)
- [x] **Score Trends** - Historical analysis
  - Moving averages (7-day, 30-day)
  - Trend direction detection (improving/stable/worsening)
  - Anomaly detection (>2 std deviations)
  - Linear forecast (30-day projection)
  - Category-level trend aggregation
- [x] **Scoring Recommendations** - Automated insights
  - Under-scored risk detection (severity language vs low score)
  - Over-scored risk detection (strong controls vs high score)
  - Missing category alerts (industry-aware)
  - KRI gap identification
  - Scoring consistency analysis (within-category variance)
  - Stale assessment warnings (>90 days)
- [x] **Prisma Models** - ScoringProfile, ScoringRule, ScoreHistory
- [x] **tRPC Router** - `scoring.*` with 14 endpoints (RBAC enforced)
- [x] **Validation** - Zod schemas for all scoring inputs
- [x] **Tests** - 83 new tests (559 total), all passing

### Sprint 10 - COMPLETE (Scoring Engine UI)
- [x] **Settings > Scoring Tab** (ADMIN+)
  - Profile config: 5 dimension weight inputs with live total validation
  - Score thresholds (low/medium/high)
  - Industry presets dropdown with apply
  - Custom scoring rules CRUD with condition builder
  - Engine status read-only display
- [x] **Risk Detail > Scoring Tab**
  - Calculate Score button (scoring.calculate mutation)
  - Composite score + grade badge display
  - 5 CSS bar charts for dimension breakdown
  - Rules applied list
  - Score history (last 10 entries)
- [x] **Dashboard Scoring Widgets**
  - ScoringRecommendationsWidget: top recommendations with severity badges
  - CategoryTrendsWidget: category scores with trend direction arrows

### Sprint 11 - COMPLETE (Board Report, Treatment Plans, Multi-Register)
- [x] **Board Report PDF Export** - Multi-page governance report (jsPDF)
  - Cover page, exec summary, risk overview, top 10, heatmap, trends, recommendations, KRI status
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

### Pages
| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ | Auth redirect |
| `/login` | ✅ | Login form with forgot password link |
| `/dashboard` | ✅ | Bento grid dashboard with draggable widgets + Board Report |
| `/risks` | ✅ | Risk register (table/heatmap) with sparklines + register filter |
| `/risks/[id]` | ✅ | Risk detail (6 tabs: Overview, AI, Treatment, Scoring, History, Docs) |
| `/workspace` | ✅ | Kanban board for risk workflow + register filter |
| `/users` | ✅ | Team management (ADMIN+) |
| `/settings` | ✅ | Profile, Security, Org, POPIA, Scoring, Registers |
| `/forgot-password` | ✅ | Password reset request |
| `/reset-password` | ✅ | Password reset with token |
| `/accept-invite` | ✅ | Accept user invitation |

### Key Components
- `RiskTable` - Sortable table with filters and sparkline trends (Sprint 7)
- `RiskForm` - Create/edit modal with scoring + AI suggestions + register selector (Sprint 7/11)
- `RiskHeatmap` - 5×5 matrix visualization
- `RiskScoreBadge` - Color-coded score display
- `AppLayout` / `Sidebar` / `Header` - Layout system (Sidebar shows Team link for ADMIN+)
- `CommandPalette` - Cmd+K quick navigation and search (Sprint 7)
- `DashboardGrid` - Draggable bento grid with react-grid-layout (Sprint 7)
- `Sparkline` - SVG mini line chart for trends (Sprint 7)
- `KriTable` - KRI list with status indicators and inline editing
- `KriForm` - Create/edit KRI with threshold configuration
- `ExcelImportModal` - Multi-format import (Excel/CSV/PDF/Word) with AI extraction
- `ErrorBoundary` - Global error boundary for React errors
- `Providers` - App providers with ErrorBoundary, tRPC, QueryClient, Session, Toaster, ThemeProvider
- `AuditTimeline` - Change history display for entities
- `VytlScoreCard` - Animated score display with grade and breakdown
- `RiskPulse` - Visual heartbeat indicator (green/amber/red based on score)
- `TopRisks` - Top 5 highest-risk items widget
- `ActivityFeed` - Recent audit log activity with user/action/timestamp
- `CategoryChart` - SVG donut chart showing risk distribution by category
- `ThemeToggle` - Dark/light mode toggle button (Sprint 8)
- `WorkspaceClient` - Kanban board with drag-and-drop (Sprint 8)
- `KanbanColumn` / `KanbanCard` - Workspace drag-and-drop components (Sprint 8)
- `WidgetWrapper` - Consistent dashboard widget container (Sprint 8)
- Dashboard Widgets - Modular widgets: StatWidget, TopRisksWidget, etc. (Sprint 8)
- `ScoringRecommendationsWidget` - Top scoring recommendations with severity (Sprint 10)
- `CategoryTrendsWidget` - Category score trends with direction arrows (Sprint 10)
- `BoardReportModal` - PDF generation modal with data readiness checklist (Sprint 11)
- `TreatmentActions` - Treatment action list with progress bar and inline form (Sprint 11)

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
│   │   └── parse-document/route.ts       # PDF/Word parsing
│   ├── dashboard/page.tsx
│   ├── login/page.tsx
│   ├── risks/
│   │   ├── page.tsx, risks-client.tsx
│   │   └── [id]/page.tsx, risk-detail-client.tsx
│   ├── kris/
│   │   └── page.tsx, kris-client.tsx
│   ├── workspace/                        # Risk workflow kanban (Sprint 8)
│   │   └── page.tsx, workspace-client.tsx
│   ├── users/
│   │   └── page.tsx, users-client.tsx    # Team management (Sprint 6)
│   ├── settings/
│   │   └── page.tsx, settings-client.tsx # Full settings (Sprint 6)
│   ├── accept-invite/page.tsx            # User invite acceptance (Sprint 6)
│   ├── forgot-password/page.tsx          # Password reset request (Sprint 6)
│   ├── reset-password/page.tsx           # Password reset with token (Sprint 6)
│   ├── error.tsx                         # Global error page (Sprint 6)
│   └── not-found.tsx                     # 404 page (Sprint 6)
├── components/
│   ├── app-layout.tsx, sidebar.tsx, header.tsx
│   ├── risk-table.tsx, risk-form.tsx, risk-heatmap.tsx
│   ├── command-palette.tsx              # Cmd+K navigation (Sprint 7)
│   ├── dashboard-grid.tsx               # Bento grid layout (Sprint 7)
│   ├── sparkline.tsx                    # SVG trend charts (Sprint 7)
│   ├── theme-toggle.tsx                 # Dark/light mode toggle (Sprint 8)
│   ├── kri-table.tsx, kri-form.tsx
│   ├── excel-import-modal.tsx
│   ├── audit-timeline.tsx
│   ├── vytl-score-card.tsx
│   ├── error-boundary.tsx               # React error boundary (Sprint 6)
│   ├── dashboard/
│   │   ├── risk-pulse.tsx, top-risks.tsx
│   │   ├── activity-feed.tsx, category-chart.tsx
│   │   ├── widget-wrapper.tsx           # Widget container (Sprint 8)
│   │   ├── widgets/                     # Modular widgets (Sprint 8)
│   │   │   ├── stat-widget.tsx
│   │   │   ├── top-risks-widget.tsx
│   │   │   ├── activity-feed-widget.tsx
│   │   │   ├── category-chart-widget.tsx
│   │   │   ├── vytl-score-widget.tsx
│   │   │   ├── risk-pulse-widget.tsx
│   │   │   ├── status-breakdown-widget.tsx
│   │   │   ├── scoring-recommendations-widget.tsx  # Sprint 10
│   │   │   ├── category-trends-widget.tsx           # Sprint 10
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── workspace/                       # Kanban components (Sprint 8)
│   │   ├── kanban-column.tsx
│   │   ├── kanban-card.tsx
│   │   └── email-forward-modal.tsx
│   └── risk-score-badge.tsx, providers.tsx
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── db.ts            # Prisma client
│   ├── trpc.ts          # tRPC server setup + RBAC procedures (Sprint 6)
│   ├── trpc-client.ts   # tRPC React client
│   ├── audit.ts         # Audit logging utilities
│   ├── rate-limit.ts    # In-memory rate limiting (Sprint 6)
│   ├── use-debounce.ts  # Debounce hooks for AI suggestions (Sprint 7)
│   ├── recent-items.ts  # Recent items localStorage tracking (Sprint 7)
│   ├── theme-context.tsx         # Theme provider context (Sprint 8)
│   ├── vytl-score.ts            # Vytl Score calculation (4 dimensions)
│   ├── scoring-engine.ts        # 5-dimension composite scoring engine (Sprint 9)
│   ├── scoring-validation.ts    # Zod schemas for scoring inputs (Sprint 9)
│   ├── scoring-recommendations.ts # Auto-generated scoring insights (Sprint 9)
│   ├── score-trends.ts          # Trend analysis + forecasting (Sprint 9)
│   ├── industry-profiles.ts     # SA industry scoring presets (Sprint 9)
│   ├── board-report.ts          # Board report PDF generation (Sprint 11)
│   ├── treatment-validation.ts  # Treatment action Zod schemas (Sprint 11)
│   └── register-validation.ts   # Register Zod schemas + delete guards (Sprint 11)
├── components/
│   ├── board-report-modal.tsx   # PDF report generation modal (Sprint 11)
│   └── treatment-actions.tsx    # Treatment action list + form (Sprint 11)
└── server/routers/
    ├── index.ts         # Root router
    ├── risk.ts          # Risk CRUD + bulkCreate + stats + topRisks + workspace + registers
    ├── kri.ts           # KRI CRUD + status calc
    ├── audit.ts         # Audit log queries + recent activity
    ├── assessment.ts    # Vytl Score assessment CRUD
    ├── ai-analysis.ts   # Claude AI risk analysis (rate limited)
    ├── import.ts        # AI document extraction (rate limited)
    ├── user.ts          # User management + password reset (Sprint 6)
    ├── organisation.ts  # Org settings + POPIA (Sprint 6)
    ├── scoring.ts       # Scoring engine API (14 endpoints) (Sprint 9)
    ├── treatment.ts     # Treatment action CRUD (Sprint 11)
    └── register.ts      # Risk register CRUD (Sprint 11)

tests/                                   # Vitest tests (Sprint 8-11)
├── setup.ts
├── server/routers/risk.test.ts
└── utils/
    ├── scoring-engine.test.ts       # Scoring engine tests (Sprint 9)
    ├── scoring-validation.test.ts   # Validation schema tests (Sprint 9)
    ├── industry-profiles.test.ts    # Industry profile tests (Sprint 9)
    ├── score-trends.test.ts         # Trend analysis tests (Sprint 9)
    ├── board-report.test.ts         # Board report PDF tests (Sprint 11)
    ├── treatment-actions.test.ts    # Treatment action tests (Sprint 11)
    └── register-validation.test.ts  # Register validation tests (Sprint 11)

.session-templates/                      # Dev documentation (Sprint 8)
├── api-routes.md
├── data-model.md
└── common-patterns/

public/templates/
└── risk-import-template.xlsx  # Downloadable import template

scripts/
└── generate-import-template.ts  # Regenerate Excel template
```
