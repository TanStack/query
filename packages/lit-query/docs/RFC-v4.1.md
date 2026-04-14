# RFC v4.1: Implementation Plan for `@tanstack/lit-query`

## Summary

Build a production-ready Lit adapter for TanStack Query Core with explicit lifecycle guarantees, stable public APIs, and measurable validation gates. This RFC records the adapter scope, parity targets, lifecycle contracts, and release-readiness criteria.

## Scope Contract

### In Scope (v1)

1. `QueryClientProvider`, `useQueryClient`
2. `createQueryController`
3. `createMutationController`
4. `createInfiniteQueryController`
5. `createQueriesController`
6. `useIsFetching`, `useIsMutating`, `useMutationState`
7. `queryOptions`, `infiniteQueryOptions`, `mutationOptions`
8. Cancellation/AbortSignal handling
9. Reconnect-idempotent lifecycle behavior

### Deferred (post-v1)

1. SSR/hydration
2. Full devtools parity
3. Persist wrappers
4. Environment-specific convenience helpers in the core package

### Non-Goals

1. Render-count parity with React/Vue/Svelte adapters
2. Experimental Query Core APIs outside the adapter scope

## Parity Tiers (explicit)

1. **Tier A: Core correctness**

- Query/mutation state transitions
- Retry/backoff
- Invalidation/refetch behavior
- Cancellation/abort
- Cache/stale transitions

2. **Tier B: Reliability + DX**

- `useIsFetching`, `useIsMutating`, `useMutationState`
- Options helpers and baseline type inference
- Stale-closure protections
- Lifecycle stress/leak reliability

3. **Tier C: Advanced parity**

- Infinite query controller
- Multi-query orchestration (`createQueriesController`)
- Complex type inference parity for multi-query APIs

## Public API / Interface Decisions

```ts
createQueryController(host: ReactiveControllerHost, options: Accessor<...>, queryClient?: QueryClient): QueryResultAccessor<...>
createMutationController(host: ReactiveControllerHost, options: Accessor<...>, queryClient?: QueryClient): MutationResultAccessor<...>
createInfiniteQueryController(host: ReactiveControllerHost, options: Accessor<...>, queryClient?: QueryClient): InfiniteQueryResultAccessor<...>
createQueriesController(host: ReactiveControllerHost, options: Accessor<...>, queryClient?: QueryClient): QueriesResultAccessor<...>

useIsFetching(host: ReactiveControllerHost, filters?: Accessor<QueryFilters>): Accessor<number>
useIsMutating(host: ReactiveControllerHost, filters?: Accessor<MutationFilters>): Accessor<number>
useMutationState(host: ReactiveControllerHost, filters?: Accessor<...>): Accessor<...>

useQueryClient(): QueryClient
resolveQueryClient(explicit?: QueryClient): QueryClient
```

### Clarifications

1. `host` is **required** for `useIsFetching/useIsMutating/useMutationState` to enforce safe lifecycle cleanup.
2. `useQueryClient()` is provider lookup only.
3. `resolveQueryClient(explicit?)` is the explicit-or-context helper to avoid ambiguous semantics.

## ADRs (required before implementation)

1. **ADR-001: Controller Lifecycle + Update Scheduling**

- Connect/disconnect/reconnect semantics
- Idempotency: no duplicate observers/listeners/timers across reconnect cycles
- Update coalescing model and render-read contract

2. **ADR-002: Error and Callback Semantics**

- Error propagation contract
- Callback behavior (`onSuccess/onError/select`) and stale closure mitigation

3. **ADR-003: Options Reactivity Contract**

- Accessor evaluation timing
- Diffing strategy for options/query keys
- Identity-change handling guarantees
- Coalescing behavior under rapid option churn

## Compatibility and Dependency Policy

1. Lit support: `2.x` and `3.x` (CI matrix)
2. Query Core support: declared `^5.x` range with upgrade test matrix
3. Browser/runtime matrix: executed in CI/nightly for supported targets
4. Semver policy: breaking behavior only in major releases with migration notes

## Numeric Gates (filled in Phase 0 with reproducible method)

| Gate                                           | Threshold |
| ---------------------------------------------- | --------- |
| Bundle delta (gzip)                            | `<= X KB` |
| Retained observers/listeners after 1000 cycles | `0`       |
| Memory growth after 1000 cycles                | `<= Y MB` |
| Duplicate request delta vs baseline            | `<= Z%`   |
| Observer-update p95 latency                    | `<= N ms` |
| Release error-rate delta vs baseline           | `<= M%`   |

### Measurement Rule

All gates must include measurement procedure, runtime/browser environment, sample size, load profile, and baseline method in the Phase 0 artifact.

## Execution Plan

1. **Phase 0 (Week 1): Discovery + Scope Lock**

- Compatibility report (CSP/module/runtime)
- Adapter/test audit
- Scope matrix and non-goals lock
- Numeric gates finalized (`X,Y,Z,N,M`) with procedures
- Risk register with owners
- Go/no-go + kill criteria

2. **Phase 1 (Week 2): Foundation**

- Package scaffold, CI, provider/context
- API draft + freeze checkpoint
- Ownership/SLA/release model

3. **Phase 2 (Weeks 3-4): Tier A**

- Base lifecycle engine
- Query + mutation controllers
- Tier A contract tests
- Lifecycle matrix tests for reconnect idempotency

4. **Phase 3A (Weeks 5-6): Tier B**

- Fetch/mutate/mutation-state observers
- Options helpers + inference baseline
- Stale-closure, race, leak hardening

5. **Phase 3B (Week 7): Tier C**

- Infinite + multi-query controllers
- Advanced type inference parity tests

### Phase 3B Slip Policy (explicit)

If Phase 3B misses gate:

1. Ship **v1.0** only if the initial integration target does not require Tier C.
2. Mark Tier C as **v1.1 committed scope** with dated milestone.
3. Do not silently claim full parity in v1.0 docs.

4. **Phase 4 (Weeks 8-9): Environment Validation**

- Named integration flow + owner
- Baseline vs migrated metrics comparison
- Feature flags, alerts, rollback runbook
- Exit: zero **adapter-attributable** Sev-1/Sev-2

7. **Phase 5 (Weeks 10-11): Release Validation**

- API freeze (or explicit break list)
- Docs and staged rollout validation
- Ownership handoff and stable metrics sign-off

### Hardening Addendum (2026-03-05)

This addendum records lifecycle P0 and core test-coverage work completed after the initial plan.

Completed:

1. Lifecycle hardening in `src/controllers/BaseController.ts`

- post-destroy microtask guard added
- context callback guard added
- context unsubscribe/consumer teardown on `destroy()`

2. Constructor safety hardening in `src/createQueryController.ts`

- no-explicit-client path now defers observer initialization until a client resolves

3. PR-gated tests implemented:

- `M1`, `M2`, `M3`, `M5`, `M17` in `src/tests/query-controller.test.ts`
- `M11` in `src/tests/mutation-controller.test.ts`

4. Additional Phase 2 Tier-A tests implemented:

- `M4`, `M6`, `M7`, `M8` in `src/tests/query-controller.test.ts`
- `M9`, `M10` in `src/tests/mutation-controller.test.ts`
- `M15`, `M16` confirmed in `src/tests/context-provider.test.ts`

5. Phase 2 PR-gated matrix status:

- All Phase 2 P0 matrix items (`M1`-`M11`, `M15`, `M16`, `M17`) are now marked complete in `docs/TEST_MATRIX.md`.

6. Tracking documents updated:

- `docs/TEST_MATRIX.md`
- `docs/adr/ADR-001-controller-lifecycle.md`

7. Phase 3A kickoff coverage implemented:

- `M12` callback order/count in `src/tests/mutation-controller.test.ts`
- `LIFE-01`, `LIFE-02`, `AREACT-01` in `src/tests/query-controller.test.ts`
- `AREACT-02` in `src/tests/mutation-controller.test.ts`
- `S1`, `S2`, `S3` in `src/tests/counters-and-state.test.ts`
- Cross-controller client-switch verification in `src/tests/client-switch-controllers.test.ts`

8. Additional Phase 3A query-race/semantics coverage implemented:

- `QSEM-03` invalidation -> refetch in `src/tests/query-controller.test.ts`
- `CANCEL-02` stale overwrite prevention in `src/tests/query-controller.test.ts`
- `S6` rapid key/options churn stability in `src/tests/query-controller.test.ts`

9. Phase 3B Tier-C coverage implemented:

- `M13`, `CQS-ADV-01`, `CQS-ADV-02` in `src/tests/queries-controller.test.ts`
- `M14`, `INFEDGE-01`, `OPT-01` (infinite + options helpers smoke) in `src/tests/infinite-and-options.test.ts`

10. Post-Phase-3B hardening additions implemented:

- `CANCEL-01` AbortSignal propagation in `src/tests/query-controller.test.ts`
- `S8` provider swap while disconnected lifecycle contract in `src/tests/context-provider.test.ts`
- `L1`, `L2` type inference coverage in `src/tests/type-inference.test.ts`

11. Stretch-goal query semantics coverage implemented:

- `QSEM-01` (`refetchOnMount` stale vs fresh policy) in `src/tests/query-controller.test.ts`
- `QSEM-02` (`select` transform + throw path) in `src/tests/query-controller.test.ts`
- `S5` (`placeholderData`/`keepPreviousData` transition contract) in `src/tests/query-controller.test.ts`

### Phase Completion Log

| Phase                        | Status                     | Commit                             | Tests                                                                      | Date       |
| ---------------------------- | -------------------------- | ---------------------------------- | -------------------------------------------------------------------------- | ---------- |
| P0                           | Complete                   | `8c0632b`                          | planning/docs baseline                                                     | 2026-03-05 |
| P1                           | Complete                   | `8c0632b`                          | package scaffold + CI in place                                             | 2026-03-05 |
| P2                           | Complete                   | `8c0632b`                          | Tier-A gate set complete (`M1-M11`, `M15-M17`)                             | 2026-03-05 |
| P3A                          | Complete                   | `a96295b`                          | lifecycle/reactivity/callback/counter coverage added                       | 2026-03-05 |
| P3B                          | Complete                   | `d82ae87`                          | Tier-C + hardening gates (`S8`, `CANCEL-01`, `L1/L2`)                      | 2026-03-05 |
| P3 Stretch                   | Complete                   | `1dae57e`                          | query semantics stretch (`QSEM-01/02`, `S5`)                               | 2026-03-05 |
| P4 (Repo Preflight)          | Complete                   | `edc460c` + local evidence updates | local integration preflight + bundle + L3 stress evidence recorded         | 2026-03-06 |
| P4 (Environment Gate)        | Pending external execution | `N/A`                              | `SN-01`..`SN-06` evidence required in `docs/TEST_MATRIX_INTEGRATION.md`    | 2026-03-06 |
| P5 (Release Validation Prep) | In progress                | `TBD`                              | staged rollout validation remains to be executed in the target environment | 2026-03-06 |

## Testing Strategy

1. Framework-agnostic behavior contract tests (Tier A)
2. Lit lifecycle matrix tests (connect/disconnect/reconnect idempotency)
3. Type inference tests (public API, especially `createQueriesController`)
4. Integration tests with real Lit hosts and mocked APIs
5. Stress/regression tests: 1000 cycles, rapid key churn, offline/online, focus/refocus
6. Environment smoke + staged validation in target runtime paths

### Test Governance Documents

- PR-gated deterministic core tests: `docs/TEST_MATRIX.md`
- Environment integration gates: `docs/TEST_MATRIX_INTEGRATION.md`
- Stress/performance and latency gates (nightly/release): `docs/TEST_MATRIX_PERF.md`

### Matrix Policy

1. `TEST_MATRIX.md` is the source of truth for fast, deterministic PR CI gates.
2. `TEST_MATRIX_INTEGRATION.md` is the source of truth for Phase 4/5 environment validation.
3. `TEST_MATRIX_PERF.md` is the source of truth for heavy stress/performance checks (nightly/release).
4. Tests may be promoted/demoted between matrices based on runtime cost, determinism, and flakiness.

## Ownership and Review Policy

1. Named maintainer + backup, triage SLA, release cadence
2. Incident policy with severity-based response SLA
3. Rollback order: flag off -> version revert -> cache clear if required
4. Review policy:

- Human-authored architecture/contracts are source of truth
- Code changes must include targeted tests when behavior changes
- Senior review mandatory for lifecycle/concurrency code
- Perf-change PRs require benchmark proof
- No copied upstream-derived generated content without license/provenance review

## Track B (Upstream) Gate

Begin Track B only after:

1. Track A Phase 3A gate passed
2. Maintainer alignment confirmed
3. Public API has no environment-specific coupling
4. Maintenance commitment approved

## Timeline

1. 1 engineer: target 11 weeks (realistic 11-13)
2. 2 engineers: target 8 weeks (realistic 8-9)

## Assumptions and Defaults

1. Target runtime compatibility has no hard blockers after mitigations.
2. SSR/hydration not required for v1.
3. Release readiness is prioritized over broad parity claims.
