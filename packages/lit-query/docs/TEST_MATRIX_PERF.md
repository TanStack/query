# Test Matrix (Performance / Stress)

Last updated: 2026-03-06

This document tracks heavy stress/performance gates that should run nightly or in release validation, not every PR.

## Scope

- In scope: stress, leak, memory growth, high-fanout behavior, latency gates.
- Out of scope: deterministic core correctness (see `TEST_MATRIX.md`).

## Status Legend

- `[ ]` not started
- `[~]` in progress
- `[x]` complete

## Performance and Stress Cases

| ID      | Status | Scenario                       | Acceptance Criteria                                                          | Priority | Execution Frequency | Phase Gate | Notes                                                                                                                |
| ------- | ------ | ------------------------------ | ---------------------------------------------------------------------------- | -------- | ------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| PERF-01 | [x]    | 1000 lifecycle cycles          | observer/listener retained count returns to baseline (`0`) after stress      | P0       | nightly             | P3A/P5     | Local manual run passed (`retainedObserversAfterRun: 0`) in `docs/phase4/L3_MANUAL_STRESS_RUN.md`                    |
| PERF-02 | [x]    | Memory growth threshold        | memory growth under stress remains `<= 10 MB`                                | P0       | nightly             | P3A/P5     | Local manual run passed (`memoryGrowthMb: 4.374`, threshold `<= 10 MB`) in `docs/phase4/L3_MANUAL_STRESS_RUN.md`     |
| PERF-03 | [ ]    | Rapid key/options churn stress | no duplicate subscriptions and stable final state under churn                | P0       | nightly             | P3A        | Heavier/nightly variant of PR-gated `S6`; longer duration + higher iteration count (see `docs/TEST_MATRIX.md`, `S6`) |
| PERF-04 | [ ]    | Multi-host fanout stability    | many hosts on shared client/query remain stable and leak-free                | P1       | nightly             | P3A        | Scale behavior                                                                                                       |
| PERF-05 | [ ]    | Observer->render latency p95   | latency remains within threshold `<= 20 ms` under defined load profile       | P1       | release             | P5         | RFC numeric gate                                                                                                     |
| PERF-06 | [ ]    | Queries/infinite churn stress  | dynamic multi-query/infinite page churn does not leak or duplicate observers | P1       | nightly             | P3B/P5     | Advanced parity                                                                                                      |

## Measurement Procedure

Each run must include:

1. runtime/browser/environment
2. load profile
3. sample size
4. baseline comparison method
5. threshold values used (`X`, `Y`, `Z`, `N`, `M`)

Reference:

- `docs/phase0/measurement-gates.md`

## Latest Evidence

1. Local L3 run: `docs/phase4/L3_MANUAL_STRESS_RUN.md`
2. Local bundle run: `docs/phase4/BUNDLE_MEASUREMENT.md`
