# Sprint A Completion Checklist

## Code Implementation
- [x] Industry templates file created (45 risks total — 3 templates × 15 risks)
- [x] FTUE wizard components built (3 screens: welcome → industry → confirmation)
- [x] Template tRPC router implemented (`template.apply`, `exitSampleMode`, `clearSampleData`, `getSampleModeStatus`)
- [x] Sample mode database fields added (`isInSampleMode`, `sampleDataAppliedAt`, `sampleDataExitedAt`)
- [x] Sample data banner component created (`SampleDataBanner`)
- [x] Banner integrated into `AppLayout` above `Header`
- [x] Auto-exit logic added to `risk.update` mutation

## Testing
- [x] 49 integration tests written (`tests/integration/onboarding-flow.test.ts`)
- [x] All automated tests passing — **1008 tests across 31 files**
- [x] Pre-existing stale tests fixed (3 appetite-validation colour expectations)
- [x] All 3 industry templates validated end-to-end
- [x] Sample mode exit paths tested (manual exit, clear data, auto-exit on edit)
- [x] Multi-tenancy isolation verified (2-org data separation test)
- [x] Edge cases covered (duplicate apply guard, refCode format, fresh-state guard)

## Quality Gates
- [x] All 3 industry templates apply successfully (15 risks each)
- [x] Sample mode banner appears when `isInSampleMode = true`
- [x] "Make This My Data" exits mode and preserves all risks
- [x] "Start Fresh" deletes all risks, registers, and assessments
- [x] Auto-exit triggers on first risk edit
- [x] Guard prevents duplicate template application
- [x] Data integrity: residualScore ≤ inherentScore for all 45 template risks
- [x] Multi-tenancy: clearing org1 data does not affect org2

## Bug Resolution
- [x] 0 P0 bugs found
- [x] 0 P1 bugs found
- [x] 1 P2 bug found and fixed (stale colour test expectations)

## Documentation
- [x] Bug tracking document created (`SPRINT_A_BUGS.md`)
- [x] Completion checklist filled out (this file)

## Sign-Off
- [ ] Avi approval for Sprint A completion
- [ ] Ready to proceed to Sprint B (Excel Import Hardening)

**Completion Date:** 2026-03-06
**Test Count:** 1008 passing (was 956 before Sprint A Day 7 — +52 new tests)
**Bugs Found:** P0: 0 | P1: 0 | P2: 1
**Bugs Fixed:** P0: 0 | P1: 0 | P2: 1
