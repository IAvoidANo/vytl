# Vytl MVP Backlog

## Sprint 5 - RECOMMENDED PRIORITY

### AI Risk Analysis (High Value)
- [ ] Claude API integration for individual risk analysis
- [ ] Auto-generate risk summaries on detail page
- [ ] Suggested controls recommendations
- [ ] Score justification narratives
- [ ] "Generate Analysis" button → AI tab populated

### Dashboard Upgrades (User Experience)
- [ ] Risk Pulse indicator (overall health score)
- [ ] Top 5 highest-risk items widget
- [ ] Recent activity feed (from audit logs)
- [ ] Risk by category donut chart

### Vytl Score (Differentiator)
- [ ] Composite organisation risk score (0-100)
- [ ] Letter grade assignment (A-F)
- [ ] Score breakdown by category
- [ ] Display on dashboard

**Rationale**: AI Analysis adds immediate value to existing risks, Dashboard makes the app more useful daily, and Vytl Score is the unique selling point.

---

## Future Sprints

### Sprint 6 - Settings & Users
- [ ] Organisation profile editing
- [ ] User management (invite, roles)
- [ ] POPIA compliance settings
- [ ] Data retention configuration

### Sprint 7 - Advanced Features
- [ ] Email forwarding for risk capture
- [ ] KRI trend sparklines
- [ ] Board report PDF export

## Vytl Score Calculation
- [ ] Composite risk score (0-100 scale)
- [ ] Letter grade assignment (A-F)
- [ ] Score breakdown by category
- [ ] Trend tracking over time
- [ ] Score comparison benchmarks

## AI Risk Analysis Integration
- [ ] Claude API integration for risk analysis
- [ ] Auto-generate risk summaries
- [ ] Suggested controls recommendations
- [ ] Score justification narratives
- [ ] Similar risk detection

## Email Forwarding for Risk Capture
- [ ] Inbound email parsing (email-parse)
- [ ] Auto-create risks from emails
- [ ] Attachment extraction to S3
- [ ] Sender verification
- [ ] Email status tracking (PENDING/PROCESSED/REJECTED)

## Dashboard Upgrades
- [ ] Risk Pulse indicator (overall health)
- [ ] Top 5 risks widget
- [ ] Recent activity feed
- [ ] KRI trend sparklines
- [ ] Risk by category chart
- [ ] Monthly comparison stats

## Settings Page Completion
- [ ] Organisation profile editing
- [ ] POPIA compliance settings
- [ ] Data retention configuration
- [ ] User management (invite, roles)
- [ ] Notification preferences
- [ ] API key management

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

### Sprint 4 - Monitoring & Import
- [x] KRI monitoring dashboard (cards + table views)
- [x] KRI inline value editing
- [x] Excel/CSV import with column mapping
- [x] Audit logging for risk mutations
- [x] Audit timeline in risk History tab
- [x] Smart field mapping with pattern-based auto-detection
- [x] PDF document support (pdf-parse)
- [x] Word document support (mammoth)
- [x] Claude AI extraction for unstructured documents
- [x] Enhanced validation preview (green/amber/red rows)
