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

## Future Backlog
- [ ] Board report PDF export
- [ ] Risk treatment plans
- [ ] Control effectiveness tracking
- [ ] Regulatory mapping (King IV, ISO 31000)
- [ ] Multi-register support
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

## MVP Complete - Ready for Beta Deployment 🚀

The Vytl Risk Management platform is now feature-complete for beta release with:
- Full risk lifecycle management (CRUD, scoring, analysis)
- AI-powered risk analysis and form suggestions
- Role-based access control (5 roles)
- User management with invite system
- Password reset functionality
- KRI monitoring dashboard
- Multi-format document import (Excel, CSV, PDF, Word)
- Audit logging with full history
- Customizable bento grid dashboard
- Command palette for power users
- POPIA compliance settings
