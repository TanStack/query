# TKDodo Cross-Check

Checked on 2026-06-03 against `https://tkdodo.eu/blog/tan-stack-router-and-query`, which lists 33 React Query series parts, and `https://tkdodo.eu/blog/all` for adjacent Query-tagged posts.

## Coverage Decisions

| Priority | Post | Coverage |
| --- | --- | --- |
| #1 | Practical React Query | `fetch-and-observe-queries`, `tune-defaults-freshness-retries-and-refetching` |
| #2 | React Query Data Transformations | `seed-placeholder-select-and-transform-data`, `selectors-and-derived-state` |
| #3 | React Query Render Optimizations | `shape-data-and-render-efficiently`, `selectors-and-derived-state` |
| #4 | Status Checks in React Query | Added `handle-status-and-errors` |
| #5 | Testing React Query | `test-query-code` |
| #6 | React Query and TypeScript | `design-query-keys-and-options`, `build-query-abstractions` |
| #7 | Using WebSockets with React Query | `broadcast-realtime-and-multi-tab-synchronization` |
| #8 | Effective React Query Keys | `design-query-keys-and-options` |
| #8a | Leveraging the Query Function Context | `design-query-keys-and-options`, `cancel-queries-and-consume-abort-signals` |
| #9 | Placeholder and Initial Data in React Query | `seed-placeholder-select-and-transform-data` |
| #10 | React Query as a State Manager | `selectors-and-derived-state`, `query-data-and-forms` |
| #11 | React Query Error Handling | Added `handle-status-and-errors` |
| #12 | Mastering Mutations in React Query | `write-mutations-and-invalidate-related-queries` |
| #13 | Offline React Query | `persist-offline-and-restore-caches` |
| #14 | React Query and Forms | Added `query-data-and-forms` |
| #15 | React Query FAQs | Distributed across keys, mutations, defaults, forms, and status skills |
| #16 | React Query meets React Router | `prefetch-and-remove-request-waterfalls`; React Router remains secondary to TanStack Router/Start |
| #17 | Seeding the Query Cache | `seed-placeholder-select-and-transform-data` |
| #18 | Inside React Query | Added `understand-query-internals-and-observers` |
| #19 | Type-safe React Query | `design-query-keys-and-options`, `build-query-abstractions` |
| #20 | You Might Not Need React Query | `ssr-hydration-and-streaming`; no separate skill yet because it is decision guidance |
| #21 | Thinking in React Query | Distributed mental-model coverage, especially `understand-query-internals-and-observers` |
| #22 | React Query and React Context | `setup-query-client-and-providers`, `use-framework-adapter-reactivity` |
| #23 | Why You Want React Query | Introductory rationale, covered by higher-signal operational skills |
| #24 | The Query Options API | `design-query-keys-and-options`, added `build-query-abstractions` |
| #25 | Automatic Query Invalidation after Mutations | Added `automatic-invalidation-after-mutations` |
| #26 | How Infinite Queries work | `paginate-and-build-infinite-queries` |
| #27 | React Query API Design - Lessons Learned | `build-query-abstractions`, `migrate-major-versions-and-codemods` |
| #28 | React Query - The Bad Parts | Cross-cutting tradeoffs in `query-data-and-forms`, `handle-status-and-errors`, `ssr-hydration-and-streaming` |
| #29 | Concurrent Optimistic Updates in React Query | Added `concurrent-optimistic-updates` |
| #30 | React Query Selectors, Supercharged | Added `selectors-and-derived-state` |
| #31 | Creating Query Abstractions | Added `build-query-abstractions` |
| #32 | TanStack Router and Query | Tightened `compose-query-with-tanstack-router-and-start` |

## Adjacent Posts Promoted

| Post | Reason | Coverage |
| --- | --- | --- |
| Deriving Client State from Server State | Directly informs forms, selectors, and state-sync avoidance | `selectors-and-derived-state`, `query-data-and-forms` |
| React 19 and Suspense - A Drama in 3 Acts | Relevant to suspense and streaming but React-version specific | `use-suspense-and-error-boundaries`, `ssr-hydration-and-streaming` |

## Skills Added From This Audit

- `framework/handle-status-and-errors`
- `compositions/query-data-and-forms`
- `compositions/automatic-invalidation-after-mutations`
- `core/concurrent-optimistic-updates`
- `core/selectors-and-derived-state`
- `core/build-query-abstractions`
- `core/understand-query-internals-and-observers`

## Existing Skill Tightened

- `compositions/compose-query-with-tanstack-router-and-start`: added TKDodo #32 source and guidance to use one QueryClient in router/provider, set `defaultPreloadStaleTime: 0`, treat loaders as cache priming, and read route data through Query observers instead of `useLoaderData`.

