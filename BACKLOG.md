# Vytl MVP Backlog

## Import Enhancements (Next Priority)
- [ ] Smart field mapping with AI auto-detection
- [ ] PDF document support (pdf-parse library)
- [ ] Word document support (mammoth library)
- [ ] Claude AI extraction for unstructured documents
- [ ] Enhanced validation preview before import
- [ ] Import history and rollback capability

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
