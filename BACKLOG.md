# Vytl MVP Backlog

## Sprint 5 - COMPLETE ✅

### AI Risk Analysis (High Value) - COMPLETE ✅
- [x] Claude API integration for individual risk analysis
- [x] Auto-generate executive summaries on detail page
- [x] Suggested controls recommendations (3-5 specific controls)
- [x] Score justification narratives (likelihood, impact, overall)
- [x] "Analyse with AI" button in AI Analysis tab
- [x] Related risk categories identification
- [x] Suggested KRIs to monitor
- [x] Confidence score display
- [x] Regeneration support

### Dashboard Upgrades (User Experience) - COMPLETE ✅
- [x] Risk Pulse indicator (animated heartbeat based on Vytl Score)
- [x] Top 5 highest-risk items widget (sorted by residual score)
- [x] Recent activity feed (last 10 audit log entries)
- [x] Risk by category donut chart (SVG with legend)

### Vytl Score (Differentiator) - COMPLETE ✅
- [x] Composite organisation risk score (0-100)
- [x] 4 dimensions: Coverage, Control Effectiveness, Maturity, Trend (25 pts each)
- [x] Letter grade assignment: A (80+), B (60-79), C (40-59), D (20-39), F (0-19)
- [x] Score breakdown with detailed component analysis
- [x] Assessment history stored in database
- [x] VytlScoreCard component on dashboard

---

## Sprint 9 - COMPLETE ✅

### Scoring Engine (Backend) - COMPLETE ✅
- [x] 5-dimension composite risk scoring engine (0-100)
  - Base Score (40%): Normalized residual likelihood × impact
  - Control Quality (20%): Depth, specificity, and structure of controls
  - Velocity (15%): Rate of score change from audit log history
  - Correlation (15%): Cross-risk category concentration and high-risk density
  - KRI Alignment (10%): Active KRI GREEN/AMBER/RED distribution
- [x] Configurable scoring profiles per organisation
  - Dimension weight customization (must sum to 100)
  - Category importance multipliers (0.1-3.0x)
  - Risk threshold configuration (low/medium/high)
- [x] Custom scoring rules engine
  - 10 condition fields (category, status, residualScore, controls, etc.)
  - 7 operators (equals, greaterThan, contains, isEmpty, etc.)
  - Score modifiers: -25 to +25 (absolute or percentage)
  - Priority ordering (1-100)
- [x] Prisma models: ScoringProfile, ScoringRule, ScoreHistory
- [x] tRPC scoring router with 14 endpoints (RBAC enforced)
- [x] Zod validation schemas for all scoring inputs

### Industry Profiles - COMPLETE ✅
- [x] 6 pre-configured South African industry profiles:
  - Financial Services (higher compliance/regulatory weight)
  - Mining & Resources (higher environmental/safety weight)
  - Technology (higher cybersecurity/velocity weight)
  - Healthcare (higher patient safety/compliance weight)
  - Manufacturing (higher operational/supply chain weight)
  - Retail & Consumer (higher reputational/financial weight)
- [x] SA regulatory framework integration: King V, POPIA, B-BBEE, NCA, FICA

### Score Trends & Recommendations - COMPLETE ✅
- [x] Moving average calculations (7-day, 30-day)
- [x] Trend direction detection (improving/stable/worsening)
- [x] Anomaly detection (>2 standard deviations)
- [x] Linear forecast (30-day projection)
- [x] Category-level trend aggregation
- [x] Under-scored risk detection (severity language vs low score)
- [x] Over-scored risk detection (strong controls vs high score)
- [x] Missing risk category alerts (industry-aware)
- [x] KRI gap identification
- [x] Scoring consistency analysis (within-category variance)
- [x] Stale assessment warnings (>90 days)

### Testing - COMPLETE ✅
- [x] 83 new tests across 4 test files (559 total, all passing)
  - scoring-engine.test.ts (20 tests)
  - scoring-validation.test.ts (31 tests)
  - industry-profiles.test.ts (20 tests)
  - score-trends.test.ts (12 tests)

---

## Sprint 10 - COMPLETE ✅

### Scoring Engine UI - COMPLETE ✅
- [x] **Settings > Scoring Tab** (ADMIN+)
  - Profile configuration: 5 dimension weight inputs with live total validation
  - Score threshold configuration (low/medium/high)
  - Industry presets: dropdown to apply pre-configured profiles
  - Custom scoring rules: create/delete rules with condition builder
  - Engine status: read-only display of profile, rules, risks, snapshots, KRIs
- [x] **Risk Detail > Scoring Tab**
  - "Calculate Score" button calling scoring.calculate mutation
  - Composite score display (large number + grade badge, color-coded)
  - 5 CSS bar charts for dimension breakdown (Base, Control Quality, Velocity, Correlation, KRI)
  - Rules applied list with modifier values
  - Score history (last 10 entries from scoring.getHistory)
- [x] **Dashboard Widgets**
  - Scoring Recommendations widget: top recommendations with severity badges
  - Category Trends widget: category scores with trend direction arrows

---

## Sprint 11 - COMPLETE ✅

### Board Report PDF Export - COMPLETE ✅
- [x] Multi-page PDF generation with jsPDF (A4, professional styling)
  - Cover page with org name, date, Vytl branding
  - Executive summary: Vytl Score, grade, total risks, high risk count, KRIs in red
  - Risk overview: by status and by category tables with percentages
  - Top 10 risks table (ref, title, category, score, status, owner)
  - 5×5 risk heatmap (colour-coded cells with risk counts)
  - Category trends table with direction indicators
  - Top 5 scoring recommendations with severity
  - KRI status dashboard (name, current value, thresholds, status)
  - Page footers with date and page numbers
- [x] Board Report modal on dashboard with section readiness checklist
- [x] "Board Report" button in dashboard header
- [x] 12 tests covering empty data, null scores, many risks, special chars, PDF output

### Risk Treatment Plans - COMPLETE ✅
- [x] TreatmentAction Prisma model (title, description, priority, status, dueDate, assignee)
  - Priorities: LOW, MEDIUM, HIGH, CRITICAL
  - Statuses: OPEN, IN_PROGRESS, COMPLETED, CANCELLED
  - completedAt auto-set on status transition to COMPLETED
- [x] tRPC treatment router: list, create (EDITOR+), update (EDITOR+), delete (RISK_MANAGER+), stats
  - Org-scoped via risk → register → org chain
  - Audit logged for all mutations
- [x] TreatmentActions UI component in risk detail Treatment tab
  - Progress bar (completed/total)
  - Inline add form with title, description, priority, due date, assignee
  - Action cards with clickable status cycling, priority badges, delete
- [x] Zod validation schemas with pure function status transition logic
- [x] 28 tests covering validation, priority sorting, status transitions, enums

### Multi-Register Support - COMPLETE ✅
- [x] Register CRUD router: list, create (ADMIN+), update (ADMIN+), delete (ADMIN+)
  - Unique name enforcement within org
  - Delete safety: blocks if register has risks or is the only register
  - Audit logged for all mutations
- [x] Settings > Registers tab (ADMIN+)
  - Create register form (name, description, status: Draft/Active/Archived)
  - Register list with risk counts and status badges
  - Inline edit (name, description, status)
  - Delete with error feedback
- [x] Register selector in risk creation form (auto-selects first register)
- [x] Register filter dropdown on risk list page and workspace kanban
- [x] listForWorkspace supports optional registerId filter
- [x] Zod validation schemas with canDeleteRegister pure function
- [x] 27 tests covering create/update schemas, status enum, delete safety checks

### Testing - COMPLETE ✅
- [x] 67 new tests across 3 test files (626 total, all passing)
  - board-report.test.ts (12 tests)
  - treatment-actions.test.ts (28 tests)
  - register-validation.test.ts (27 tests)

---

## Sprint 12 - COMPLETE ✅

### Regulatory Mapping (King V + ISO 31000) - COMPLETE ✅
- [x] **Static Framework Data** (`regulatory-frameworks.ts`)
  - King V Code: 35 requirements across 13 principles (corporate governance)
  - ISO 31000:2018: 16 requirements (8 principles + 8 process steps)
  - Each requirement: code, frameworkId, principle, title, riskCategories[]
  - Accessor functions: getAllFrameworks, getFramework, getRequirement, etc.
  - Map-based lookups for fast access
- [x] **Validation Schemas** (`regulatory-validation.ts`)
  - Zod schemas: createRegulatoryMapping, updateRegulatoryMapping, bulkCreateMappings
  - Compliance statuses: COMPLIANT, PARTIALLY_COMPLIANT, NON_COMPLIANT, NOT_ASSESSED, NOT_APPLICABLE
  - Pure functions: calculateCoverage(), calculateOverallCoverage()
  - CoverageResult interface with per-framework and overall metrics
- [x] **Prisma Schema**
  - ComplianceStatus enum (5 statuses)
  - RegulatoryMapping model (riskId, requirementCode, complianceStatus, notes, createdById)
  - @@unique([riskId, requirementCode]) prevents duplicate mappings
  - Relations on Risk and User models
- [x] **tRPC Router** (`regulatory.ts`) with 7 endpoints
  - list (protectedProcedure): mappings for a risk
  - create (editorProcedure): single mapping with code validation
  - bulkCreate (editorProcedure): map risk to multiple requirements, skip duplicates
  - update (editorProcedure): change compliance status/notes
  - delete (riskManagerProcedure): remove mapping
  - coverage (protectedProcedure): org-wide coverage report
  - riskCoverage (protectedProcedure): per-risk coverage
  - All mutations audit logged with REGULATORY_MAPPING entity type
- [x] **Compliance Tab** in Risk Detail (7th tab with ClipboardCheck icon)
  - Coverage summary bars per framework (King V %, ISO 31000 %)
  - Color-coded: green (>80%), yellow (50-80%), red (<50%)
  - Framework sections with expandable requirement lists
  - Clickable status badges to cycle compliance status
  - "Add Mappings" panel with framework selector + requirement checkboxes
  - Grouped by principle, select-all per principle, skip already-mapped codes
  - Delete button per mapping with confirmation
- [x] **Dashboard Widget** (ComplianceCoverageWidget)
  - Overall coverage %, per-framework mini progress bars
  - Color-coded thresholds, mapped/total counts, gap indicators
- [x] **Testing** - 50 new tests across 2 test files (676 total, all passing)
  - regulatory-frameworks.test.ts (26 tests): data integrity, uniqueness, accessors
  - regulatory-validation.test.ts (24 tests): schemas, enums, coverage calculations

---

## Future Backlog
- [ ] Risk appetite configuration
- [ ] Incident linking
- [ ] Action item tracking
- [ ] Custom fields per organisation
- [ ] Bulk risk updates
- [ ] Risk templates library

---

## Completed

### Sprint 1 - Foundation
- [x] Database connection (Supabase PostgreSQL)
- [x] Authentication (NextAuth v5 Credentials)
- [x] Login page, logout, auth redirects
- [x] App layout with sidebar + header

### Sprint 2 - Risk CRUD
- [x] tRPC API routes (`/api/trpc`)
- [x] Risk CRUD (list, get, create, update, delete)
- [x] Risk Register table with sorting
- [x] Risk form with scoring sliders

### Sprint 3 - Risk Views
- [x] Risk filtering (category, status)
- [x] Risk detail page with 5-tab layout
- [x] Risk heatmap (5x5 matrix)
- [x] Table/Heatmap view toggle

### Sprint 4 - Monitoring & Import ✅
- [x] KRI monitoring dashboard (cards + table views)
- [x] KRI inline value editing
- [x] Excel/CSV import with column mapping
- [x] Audit logging for risk mutations
- [x] Audit timeline in risk History tab
- [x] Smart field mapping with pattern-based auto-detection (50+ patterns)
- [x] PDF document support (pdf-parse)
- [x] Word document support (mammoth)
- [x] Claude AI extraction for unstructured documents
- [x] Enhanced validation preview (green/amber/red rows)
- [x] Combined L×I column support (parse "3,4", "3x4", "3/4")
- [x] Intelligent header row detection (skips title rows)
- [x] Downloadable Excel import template (`/templates/risk-import-template.xlsx`)
- [x] Detailed error handling for API/parsing failures

### Sprint 5 - AI Analysis & Dashboard ✅
- [x] Vytl Score calculation (0-100, 4 dimensions)
- [x] Letter grades (A-F) with score breakdown display
- [x] Assessment history tracking
- [x] Risk Pulse indicator (animated based on Vytl Score)
- [x] Top 5 risks widget (compact, sorted by residual score)
- [x] Recent 10 activity feed (compact audit log)
- [x] Risk by category donut chart (compact SVG)
- [x] AI Risk Analysis with Claude API
  - Executive summary generation
  - Suggested controls (3-5 recommendations)
  - Score justification (L×I reasoning)
  - Related categories identification
  - Suggested KRIs to monitor
  - Confidence scoring
  - Regeneration support
  - **Apply to Risk** functionality with edit modals
  - "Applied" indicators after incorporation
- [x] Dashboard optimized for single-screen (1080p) display
- [x] Root Cause field added to Risk model
- [x] Due Date "Ongoing" checkbox option (isOngoing boolean)
- [x] Quick Actions bar retained for new user onboarding
- [x] App footer with "Vytl Risk Management" branding

### Sprint 6 - Beta Readiness ✅
- [x] **RBAC Enforcement** - Role-based access control
  - Role hierarchy: OWNER > ADMIN > RISK_MANAGER > EDITOR > VIEWER
  - editorProcedure, riskManagerProcedure, adminProcedure, ownerProcedure
  - VIEWER: Read-only access
  - EDITOR: Create/edit risks, import documents
  - RISK_MANAGER: Delete risks, manage KRIs, run AI analysis
  - ADMIN: Manage users, organisation settings
  - OWNER: Full access including user deletion
- [x] **User Management** - Complete invite system
  - Invite users with email and role assignment
  - Token-based activation (7-day expiry)
  - Role dropdown selector in user table
  - Enable/disable users (ADMIN+)
  - Delete users (OWNER only)
  - Accept invite page (/accept-invite)
  - Resend invite functionality
- [x] **Password Reset** - Token-based recovery
  - Forgot password page (/forgot-password)
  - Reset password page (/reset-password)
  - 1-hour token expiry
  - Rate limited (10 requests per 15 minutes)
- [x] **Settings Page** - Full settings with tabs
  - Profile tab: Edit name, view email/role
  - Security tab: Change password
  - Organisation tab (ADMIN+): Name, industry, employee count
  - POPIA tab (ADMIN+): Data retention days, consent management
- [x] **Rate Limiting** - Protect expensive endpoints
  - AI analysis: 10 requests/minute per user
  - Document import: 5 requests/minute per user
  - Password reset: 10 requests/15 minutes per email
  - In-memory store (production should use Redis)
- [x] **Error Handling** - Comprehensive error UI
  - Global ErrorBoundary component
  - Next.js error.tsx page with retry/redirect
  - 404 not-found.tsx page
  - Toast notifications via Sonner
- [x] **Audit Improvements** - Enhanced tracking
  - IP address extracted from x-forwarded-for/x-real-ip headers
  - User-Agent captured for all requests
  - Passed to all createAuditLog calls

### Sprint 7 - UX & Adoption Enhancements ✅
- [x] **Command Palette** (Cmd+K / Ctrl+K)
  - Quick navigation to all pages
  - Risk search by title and refCode
  - Quick actions: Create Risk, Create KRI, Import Risks
  - Recent items tracking (localStorage)
  - cmdk library integration
- [x] **Proactive AI Suggestions in Risk Form**
  - Auto-suggest category when description reaches 50+ chars
  - Suggest likelihood/impact scores with reasoning
  - "AI suggests: [Category] | L:X I:Y" banner below description
  - Tab key or Apply button to accept suggestions
  - Debounced API calls (500ms delay)
  - Visual hints on category dropdown and scoring sliders
- [x] **Sparklines in Risk Table**
  - SVG mini trend charts showing residual score history
  - Color-coded: green (improving), red (worsening), gray (stable)
  - Data extracted from audit log score changes
  - 30-day trend window
  - New "Trend" column in risk table
- [x] **Bento Grid Dashboard**
  - Draggable, resizable widgets using react-grid-layout
  - Lock/Unlock toggle for customization mode
  - Layout persistence in localStorage
  - Reset to default layout button
  - Responsive grid (12/8/4 columns based on viewport)
  - All existing widgets migrated to grid system

---

## MVP Complete - Ready for Beta Deployment

The Vytl Risk Management platform is feature-complete for beta release with:
- Full risk lifecycle management (CRUD, scoring, analysis)
- AI-powered risk analysis and form suggestions
- 5-dimension composite scoring engine with configurable profiles (Sprint 9)
- 6 SA industry-specific scoring presets with regulatory alignment (Sprint 9)
- Score trend analysis, anomaly detection, and forecasting (Sprint 9)
- Automated scoring recommendations and gap analysis (Sprint 9)
- Scoring engine UI with settings, risk detail tab, and dashboard widgets (Sprint 10)
- Board report PDF export for governance meetings (Sprint 11)
- Risk treatment plans with progress tracking (Sprint 11)
- Multi-register support with filtering (Sprint 11)
- Role-based access control (5 roles)
- User management with invite system
- Password reset functionality
- KRI monitoring dashboard
- Multi-format document import (Excel, CSV, PDF, Word)
- Audit logging with full history
- Customizable bento grid dashboard
- Command palette for power users
- POPIA compliance settings
- 626 tests across 17 test files (all passing)
