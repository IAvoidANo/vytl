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

### Sprint 5 - PLANNED (Recommended)
- [ ] AI Risk Analysis in detail page (Claude API)
- [ ] Dashboard upgrades (Risk Pulse, top risks, activity feed)
- [ ] Vytl Score calculation (0-100 with A-F grades)

### Pages
| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ | Auth redirect |
| `/login` | ✅ | Login form |
| `/dashboard` | ✅ | Stats overview |
| `/risks` | ✅ | Risk register (table/heatmap) |
| `/risks/[id]` | ✅ | Risk detail (5 tabs) |
| `/settings` | 🔲 | Org settings placeholder |

### Key Components
- `RiskTable` - Sortable table with filters
- `RiskForm` - Create/edit modal with scoring
- `RiskHeatmap` - 5×5 matrix visualization
- `RiskScoreBadge` - Color-coded score display
- `AppLayout` / `Sidebar` / `Header` - Layout system
- `KriTable` - KRI list with status indicators and inline editing
- `KriForm` - Create/edit KRI with threshold configuration
- `ExcelImportModal` - Multi-format import (Excel/CSV/PDF/Word) with AI extraction
- `AuditTimeline` - Change history display for entities

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
│   └── settings/page.tsx
├── components/
│   ├── app-layout.tsx, sidebar.tsx, header.tsx
│   ├── risk-table.tsx, risk-form.tsx, risk-heatmap.tsx
│   ├── kri-table.tsx, kri-form.tsx
│   ├── excel-import-modal.tsx
│   ├── audit-timeline.tsx
│   └── risk-score-badge.tsx, providers.tsx
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── db.ts            # Prisma client
│   ├── trpc.ts          # tRPC server setup
│   ├── trpc-client.ts   # tRPC React client
│   └── audit.ts         # Audit logging utilities
└── server/routers/
    ├── index.ts         # Root router
    ├── risk.ts          # Risk CRUD + bulkCreate
    ├── kri.ts           # KRI CRUD + status calc
    ├── audit.ts         # Audit log queries
    └── import.ts        # AI document extraction

public/templates/
└── risk-import-template.xlsx  # Downloadable import template

scripts/
└── generate-import-template.ts  # Regenerate Excel template
```
