# Test Matrix (Integration / ServiceNow Pilot)

Last updated: 2026-03-06

This document tracks environment-dependent validation for ServiceNow pilot/canary/rollout.

## Scope

- In scope: staging/pilot/canary checks, rollout controls, environment/runtime behavior.
- Out of scope: fast deterministic core logic tests (see `TEST_MATRIX.md`).

## Status Legend

- `[ ]` not started
- `[~]` in progress
- `[x]` complete
- `[x]` in this matrix is equivalent to `PASS` in the staging execution checklist.

## Integration Cases

| ID    | Status | Scenario                               | Acceptance Criteria                                                              | Priority | Execution Frequency | Phase Gate | Notes                                                                                 |
| ----- | ------ | -------------------------------------- | -------------------------------------------------------------------------------- | -------- | ------------------- | ---------- | ------------------------------------------------------------------------------------- |
| SN-01 | [~]    | Pilot flow staging smoke (happy path)  | Named ServiceNow pilot flow completes query/mutation happy path successfully     | P0       | release             | P4         | Local demo analog completed; ServiceNow staging evidence pending                      |
| SN-02 | [~]    | Pilot flow error path + recovery       | expected failure path surfaces error and UI recovers per UX contract             | P0       | release             | P4         | Local forced error/recovery analog completed; staging evidence pending                |
| SN-03 | [ ]    | Duplicate request delta vs baseline    | duplicate requests remain within threshold `<= 5%`                               | P0       | nightly             | P4         | Numeric gate                                                                          |
| SN-04 | [~]    | Focus/refocus/reconnect behavior       | no regression in fetch/mutation behavior under shell focus and reconnect changes | P0       | nightly             | P4         | Local recovery semantics covered; ServiceNow shell focus/reconnect validation pending |
| SN-05 | [ ]    | Feature-flag rollback                  | disabling flag fully bypasses adapter path and restores fallback behavior        | P0       | release             | P4         | Rollback readiness                                                                    |
| SN-06 | [ ]    | Package rollback + cache clear runbook | rollback procedure validated end-to-end in staging                               | P0       | release             | P4         | Ops readiness                                                                         |
| SN-07 | [ ]    | Canary bake progression                | metrics remain stable at 10% -> 25% -> 50% rollout windows                       | P1       | release             | P5         | GA gate                                                                               |
| SN-08 | [ ]    | Browser/runtime matrix in target shell | supported browser/runtime matrix behaves within documented constraints           | P1       | nightly             | P4/P5      | Compatibility policy; P4 non-blocker, P5 closure item                                 |

## Metrics Inputs

Use Phase-0 measurement artifact and gates from:

- `docs/phase0/measurement-gates.md`

## Reporting

For each integration run, record:

1. environment (instance/version/browser)
2. scenario IDs executed
3. pass/fail with evidence links
4. measured deltas vs baseline
5. action items/blockers

## Phase 4 Closure State

1. Repository-side Phase 4 preflight is complete (local integration smoke, bundle measurement, and L3 stress evidence captured).
2. ServiceNow environment-gated Phase 4 exit remains pending until `SN-01` through `SN-06` are executed with staging evidence links.
3. **Blocking rule:** Phase 4 environment exit requires all of `SN-01`..`SN-06` to be marked `[x]` with linked staging evidence.
