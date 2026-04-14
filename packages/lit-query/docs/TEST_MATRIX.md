# Test Matrix (PR-Gated Core)

Last updated: 2026-03-05

This document defines deterministic, fast tests that must run in PR CI.

## Scope

- In scope: deterministic unit/integration/type-correctness tests for core adapter behavior.
- Out of scope: ServiceNow rollout validation, canary/bake checks, long stress/perf benchmarks.
- Promotion rule: a test may move between matrices if runtime cost, flakiness, or environment dependence changes.

## Status Legend

- `[ ]` not started
- `[~]` in progress
- `[x]` complete

## MUST-HAVE (v1.0 blockers)

| ID         | Status | Scenario                                 | Acceptance Criteria                                                                     | Priority | Execution Frequency | Phase Gate | Notes                                         |
| ---------- | ------ | ---------------------------------------- | --------------------------------------------------------------------------------------- | -------- | ------------------- | ---------- | --------------------------------------------- |
| M1         | [x]    | Destroy-then-microtask-flush safety      | After `destroy()`, no queued microtask causes `requestUpdate()`                         | P0       | PR                  | P2         | Implemented in `query-controller.test.ts`     |
| M2         | [x]    | Lifecycle stress (100 cycles)            | Connect/disconnect x100 returns observer/listener count to baseline                     | P0       | PR                  | P2         | Implemented in `query-controller.test.ts`     |
| M3         | [x]    | Provider client switch (connected)       | Switching client while connected keeps exactly one active observer and updates continue | P0       | PR                  | P2         | Implemented in `query-controller.test.ts`     |
| M4         | [x]    | Query pending -> success                 | `createQueryController` emits expected success state contract                           | P0       | PR                  | P2         | Implemented in `query-controller.test.ts`     |
| M5         | [x]    | Query pending -> error with retry        | `failureCount/failureReason/error state` transition matches query-core behavior         | P0       | PR                  | P2         | Implemented in `query-controller.test.ts`     |
| M6         | [x]    | Query conditional enabling               | `enabled: false` does not fetch; enabling triggers fetch                                | P0       | PR                  | P2         | Implemented in `query-controller.test.ts`     |
| M7         | [x]    | Query remount with `gcTime: 0`           | Remount does not leak observers and still receives expected result                      | P0       | PR                  | P2         | Implemented in `query-controller.test.ts`     |
| M8         | [x]    | Accessor/key/options reactivity          | Option/key changes apply latest values and no stale key is used on refetch              | P0       | PR                  | P2         | Implemented in `query-controller.test.ts`     |
| M9         | [x]    | Mutation state transitions               | idle -> pending -> success/error states are correct                                     | P0       | PR                  | P2         | Implemented in `mutation-controller.test.ts`  |
| M10        | [x]    | Mutation reset                           | `reset()` clears mutation error/result state to expected baseline                       | P0       | PR                  | P2         | Implemented in `mutation-controller.test.ts`  |
| M11        | [x]    | `mutate` vs `mutateAsync` semantics      | `mutate` is non-throwing sync API; `mutateAsync` rejects/throws on error                | P0       | PR                  | P2         | Implemented in `mutation-controller.test.ts`  |
| M12        | [x]    | Mutation callback order/count            | `onSuccess/onError/onSettled` order and call counts are deterministic                   | P0       | PR                  | P3A        | Implemented in `mutation-controller.test.ts`  |
| M13        | [x]    | `createQueriesController` dynamic list   | add/remove list changes preserve result mapping and partial failure stability           | P0       | PR                  | P3B        | Implemented in `queries-controller.test.ts`   |
| M14        | [x]    | `createInfiniteQueryController` baseline | initial success + `fetchNextPage` + `fetchPreviousPage` behavior are correct            | P0       | PR                  | P3B        | Implemented in `infinite-and-options.test.ts` |
| M15        | [x]    | Missing context client                   | `useQueryClient()` without provider throws expected error                               | P0       | PR                  | P2         | Implemented in `context-provider.test.ts`     |
| M16        | [x]    | `resolveQueryClient` precedence          | explicit client always wins over context default                                        | P0       | PR                  | P2         | Implemented in `context-provider.test.ts`     |
| M17        | [x]    | No-explicit-client constructor safety    | Controller creation path is safe before/without immediate provider resolution           | P0       | PR                  | P2         | Implemented in `query-controller.test.ts`     |
| QSEM-01    | [x]    | `refetchOnMount` stale vs fresh          | stale query refetches per policy; fresh query behavior matches contract                 | P1       | PR                  | P3A        | Implemented in `query-controller.test.ts`     |
| QSEM-02    | [x]    | `select` transform + throw               | transformed data type/value is correct; thrown select errors propagate per contract     | P1       | PR                  | P3A        | Implemented in `query-controller.test.ts`     |
| QSEM-03    | [x]    | Invalidation -> refetch                  | invalidation triggers expected refetch path and state transitions                       | P1       | PR                  | P3A        | Implemented in `query-controller.test.ts`     |
| AREACT-01  | [x]    | Callback freshness (query)               | updated `select` closure is used after host updates                                     | P1       | PR                  | P3A        | Implemented in `query-controller.test.ts`     |
| AREACT-02  | [x]    | Callback freshness (mutation)            | updated `onSuccess/onError/onSettled` closures are used                                 | P1       | PR                  | P3A        | Implemented in `mutation-controller.test.ts`  |
| LIFE-01    | [x]    | Disconnect while in-flight               | disconnect unsubscribes safely with no stale update after detach                        | P1       | PR                  | P3A        | Implemented in `query-controller.test.ts`     |
| LIFE-02    | [x]    | Reconnect snapshot correctness           | settling while disconnected yields correct state snapshot on reconnect                  | P1       | PR                  | P3A        | Implemented in `query-controller.test.ts`     |
| CANCEL-01  | [x]    | AbortSignal propagation                  | queryFn receives AbortSignal from query-core context                                    | P1       | PR                  | P3A        | Implemented in `query-controller.test.ts`     |
| CANCEL-02  | [x]    | Stale overwrite prevention               | older response resolving later does not overwrite newer key result                      | P1       | PR                  | P3A        | Implemented in `query-controller.test.ts`     |
| CQS-ADV-01 | [x]    | `createQueries` reorder contract         | reordering queries preserves documented index/result mapping behavior                   | P1       | PR                  | P3B        | Implemented in `queries-controller.test.ts`   |
| CQS-ADV-02 | [x]    | `createQueries` duplicate key contract   | duplicate key behavior is explicitly documented and tested                              | P1       | PR                  | P3B        | Implemented in `queries-controller.test.ts`   |
| INFEDGE-01 | [x]    | Infinite subsequent-page error           | prior pages remain consistent when next-page fetch fails                                | P1       | PR                  | P3B        | Implemented in `infinite-and-options.test.ts` |
| OPT-01     | [x]    | Helper integration smoke                 | `queryOptions`/`mutationOptions`/`infiniteQueryOptions` integrate with controllers      | P1       | PR                  | P3A/P3B    | Implemented in `infinite-and-options.test.ts` |

## SHOULD-HAVE (v1.1 targets)

| ID  | Status | Scenario                               | Acceptance Criteria                                             | Priority | Execution Frequency | Phase Gate | Notes                                              |
| --- | ------ | -------------------------------------- | --------------------------------------------------------------- | -------- | ------------------- | ---------- | -------------------------------------------------- |
| S1  | [x]    | `useIsFetching` filters/reactivity     | count updates track start/settle and filter changes correctly   | P1       | PR                  | P3A        | Implemented in `counters-and-state.test.ts`        |
| S2  | [x]    | `useIsMutating` filters/reactivity     | mutation count updates track start/settle and filters correctly | P1       | PR                  | P3A        | Implemented in `counters-and-state.test.ts`        |
| S3  | [x]    | `useMutationState` selection/filtering | selected mutation state set is correct by key/status filters    | P1       | PR                  | P3A        | Implemented in `counters-and-state.test.ts`        |
| S4  | [ ]    | `cancelRefetch` behavior               | refetch cancellation behavior matches exposed API semantics     | P1       | PR                  | P3A        | Include only if public path supports               |
| S5  | [x]    | `placeholderData` / `keepPreviousData` | transitional data behavior matches documented semantics         | P1       | PR                  | P3A        | Implemented in `query-controller.test.ts`          |
| S6  | [x]    | Rapid key/options churn                | no duplicate subscriptions and stable final state under churn   | P1       | PR                  | P3A        | Implemented in `query-controller.test.ts`          |
| S7  | [ ]    | `isFetchedAfterMount` prefetched case  | prefetched query semantics match expected mount behavior        | P1       | PR                  | P3A        | Upstream parity                                    |
| S8  | [x]    | Provider swap while disconnected       | reconnect path mount/unmount counts are correct                 | P1       | PR                  | P3A        | Implemented in `context-provider.test.ts` (LQ-004) |

## LATER (v1.2+)

| ID  | Status | Scenario                                          | Acceptance Criteria                                                   | Priority | Execution Frequency | Phase Gate | Notes                                   |
| --- | ------ | ------------------------------------------------- | --------------------------------------------------------------------- | -------- | ------------------- | ---------- | --------------------------------------- |
| L1  | [x]    | Type inference matrix (`createQueriesController`) | tuple/object/combine inference is stable across supported TS versions | P2       | PR                  | P3B        | Implemented in `type-inference.test.ts` |
| L2  | [x]    | Helper generic inference                          | helper generics preserve inference boundaries and fail invalid combos | P2       | PR                  | P3A/P3B    | Implemented in `type-inference.test.ts` |
| L3  | [ ]    | Extended stress (1000 cycles)                     | long-cycle stress passes memory/leak thresholds in stable environment | P2       | nightly             | P5         | Heavy benchmark                         |

## Reference Sources

Primary reference:

- `.references/tanstack-query/packages/svelte-query/tests`

Secondary reference:

- `.references/tanstack-query/packages/vue-query/src/__tests__`

## Existing Local Tests

Current tests in repo:

- `src/tests/query-controller.test.ts`
- `src/tests/mutation-controller.test.ts`
- `src/tests/queries-controller.test.ts`
- `src/tests/counters-and-state.test.ts`
- `src/tests/context-provider.test.ts`
- `src/tests/client-switch-controllers.test.ts`
- `src/tests/infinite-and-options.test.ts`
- `src/tests/type-inference.test.ts`

## Execution Order (recommended)

1. M1, M2, M3, M17 (lifecycle and constructor safety)
2. M4, M5, M6, M7, M8 (query core)
3. M9, M10, M11, M12 (mutation core)
4. M13, M14 (multi-query and infinite)
5. M15, M16 (context contracts)
6. QSEM/AREACT/LIFE/CANCEL/CQS-ADV/INFEDGE/OPT additions
7. S1-S8
8. L1-L3
