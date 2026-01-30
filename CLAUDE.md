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

### Pages
| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ | Auth redirect |
| `/login` | ✅ | Login form with forgot password link |
| `/dashboard` | ✅ | Bento grid dashboard with draggable widgets |
| `/risks` | ✅ | Risk register (table/heatmap) with sparklines |
| `/risks/[id]` | ✅ | Risk detail (5 tabs) |
| `/users` | ✅ | Team management (ADMIN+) |
| `/settings` | ✅ | Profile, Security, Org, POPIA settings |
| `/forgot-password` | ✅ | Password reset request |
| `/reset-password` | ✅ | Password reset with token |
| `/accept-invite` | ✅ | Accept user invitation |

### Key Components
- `RiskTable` - Sortable table with filters and sparkline trends (Sprint 7)
- `RiskForm` - Create/edit modal with scoring + AI suggestions (Sprint 7)
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
- `Providers` - App providers with ErrorBoundary, tRPC, QueryClient, Session, Toaster
- `AuditTimeline` - Change history display for entities
- `VytlScoreCard` - Animated score display with grade and breakdown
- `RiskPulse` - Visual heartbeat indicator (green/amber/red based on score)
- `TopRisks` - Top 5 highest-risk items widget
- `ActivityFeed` - Recent audit log activity with user/action/timestamp
- `CategoryChart` - SVG donut chart showing risk distribution by category

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
│   ├── kri-table.tsx, kri-form.tsx
│   ├── excel-import-modal.tsx
│   ├── audit-timeline.tsx
│   ├── vytl-score-card.tsx
│   ├── error-boundary.tsx               # React error boundary (Sprint 6)
│   ├── dashboard/
│   │   ├── risk-pulse.tsx, top-risks.tsx
│   │   ├── activity-feed.tsx, category-chart.tsx
│   │   └── index.ts
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
│   └── vytl-score.ts    # Vytl Score calculation (4 dimensions)
└── server/routers/
    ├── index.ts         # Root router
    ├── risk.ts          # Risk CRUD + bulkCreate + stats + topRisks
    ├── kri.ts           # KRI CRUD + status calc
    ├── audit.ts         # Audit log queries + recent activity
    ├── assessment.ts    # Vytl Score assessment CRUD
    ├── ai-analysis.ts   # Claude AI risk analysis (rate limited)
    ├── import.ts        # AI document extraction (rate limited)
    ├── user.ts          # User management + password reset (Sprint 6)
    └── organisation.ts  # Org settings + POPIA (Sprint 6)

public/templates/
└── risk-import-template.xlsx  # Downloadable import template

scripts/
└── generate-import-template.ts  # Regenerate Excel template
```
