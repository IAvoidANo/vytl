# Excel Import — Enum Mapping Reference

Source: `src/lib/excel-import/enum-mapping.ts`

## Category Mappings

The import engine maps free-text category values to the canonical `RiskCategory` enum
using a three-step resolution:

1. **Direct enum match** — uppercase + underscore-normalised exact match (e.g. `HEALTH_SAFETY`)
2. **Alias table** — case-insensitive lookup against the table below (300+ normalised keys)
3. **Fuzzy match** — Levenshtein distance ≤ 3 against alias keys (handles typos)
4. **3-char prefix** — last-resort prefix match (e.g. `TEC` → `TECHNOLOGY`)
5. **Fallback** — `OPERATIONAL`, with a warning shown in the preview UI

### Accepted category values (sample)

| Input (any case) | Maps to |
|---|---|
| TECHNOLOGY, tech, it, information technology, cyber, cybersecurity, ict | `TECHNOLOGY` |
| COMPLIANCE, regulatory, legal, governance, audit, popia, fica, gdpr | `COMPLIANCE` |
| PEOPLE, hr, hrm, human resources, workforce, staff, talent, labour | `PEOPLE` |
| STRATEGIC, strategy, market, competitive, geopolitical, innovation | `STRATEGIC` |
| OPERATIONAL, ops, operations, process, supply chain, bcp, fraud | `OPERATIONAL` |
| FINANCIAL, fin, finance, credit, liquidity, fx, forex, tax, treasury | `FINANCIAL` |
| REPUTATIONAL, rep, reputation, brand, media, stakeholder, trust | `REPUTATIONAL` |
| ENVIRONMENTAL, env, environment, esg, climate, sustainability, carbon | `ENVIRONMENTAL` |
| HEALTH_SAFETY, ohs, hse, safety, health and safety, workplace safety | `HEALTH_SAFETY` |

---

## Status Mappings

Status values set both `status` (RiskStatus) and `workflowStatus` (WorkflowStatus).

| Input (any case) | `status` | `workflowStatus` |
|---|---|---|
| open, new, pending, identified, raised, draft | `OPEN` | `INBOX` |
| active, live, current, approved | `OPEN` | `APPROVED` |
| inbox | `OPEN` | `INBOX` |
| in progress, in progression, in treatment, treating, assigned | `IN_PROGRESS` | `ASSIGNED` |
| under review, in review, review | `IN_PROGRESS` | `TRIAGE` |
| triage, triaging | `OPEN` | `TRIAGE` |
| monitoring, monitor, watch, tracked, accepted, residual | `MONITORING` | `APPROVED` |
| closed, complete, completed, done, resolved, mitigated, treated | `CLOSED` | `APPROVED` |
| archived, archive, historical, retired, superseded, obsolete, inactive | `ARCHIVED` | `APPROVED` |

If both fields are blank/unknown, the `bulkCreate` router applies its own defaults
(`status=OPEN`, `workflowStatus=INBOX`).

---

## Workflow Status Mappings

Used when the import file has a dedicated Workflow Status / Kanban column.

| Input | Maps to |
|---|---|
| inbox, new, received, unassigned | `INBOX` |
| triage, triaging, under review, in review, review, pending review | `TRIAGE` |
| assigned, in progress, in treatment, working | `ASSIGNED` |
| approved, complete, completed, closed, live, active, monitoring | `APPROVED` |

---

## Confidence Levels

| Level | Meaning |
|---|---|
| `exact` | Direct enum match or exact alias table hit |
| `fuzzy` | Levenshtein match (distance 1-3), prefix match, or keyword substring |
| `failed` | No match found; default value applied; warning shown in preview |

---

## Adding New Mappings

Edit `src/lib/excel-import/enum-mapping.ts`:

- `CATEGORY_MAPPINGS` — add `'new phrase': 'CATEGORY_ENUM'`
- `STATUS_MAPPINGS` — add `'new phrase': { status: '...', workflowStatus: '...' }`
- `WORKFLOW_STATUS_MAPPINGS` — add `'new phrase': 'WORKFLOW_ENUM'`

Keys **must** be pre-normalised (lowercase, spaces instead of hyphens/underscores, no punctuation).
The `normalizeText()` function applies this transformation automatically before lookup.
