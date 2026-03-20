# Sprint A — Bugs Found During Testing

## Critical (P0) — Launch Blockers

_None found._

---

## High (P1) — User Experience Issues

_None found._

---

## Medium (P2) — Polish / Pre-existing

### BUG-A-001: appetite-validation tests used stale colour expectations
**Severity:** P2
**Found in:** Automated test run (Sprint A Day 7)
**Description:** Three tests in `tests/utils/appetite-validation.test.ts` were checking for
`'yellow'` (original colour) and per-band text colours, but `bandToColorClasses` was updated
to use `'amber'` for MEDIUM and `bandToHeatmapTextClass` was simplified to always return
`'text-white'` during the Sprint 15 heatmap refactor. Tests were passing `yellow` → now `amber`.
**Files affected:** `tests/utils/appetite-validation.test.ts` (lines 272–305)
**Status:** FIXED
**Fix:** Updated test expectations to `'amber'` for MEDIUM band; updated `bandToHeatmapTextClass`
tests to assert `'text-white'` for all bands.

---

## Bug Summary
| Severity | Open | Fixed |
|----------|------|-------|
| P0 (Critical) | 0 | 0 |
| P1 (High) | 0 | 0 |
| P2 (Medium) | 0 | 1 |

**Sprint A can launch:** ✅ 0 P0 bugs, 0 P1 bugs
