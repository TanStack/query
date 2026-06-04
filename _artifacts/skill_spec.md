# TanStack Query - Skill Spec

TanStack Query manages server state through a framework-agnostic cache, observers, framework adapters, persistence utilities, devtools, lint rules, and migration tooling. This draft follows the published docs order in `docs/config.json` and treats TKDodo's blog order as an external priority signal.

TanStack Start and TanStack Router are first-class composition targets here, especially for loaders, SSR hydration, streaming, and cache handoff. Next.js remains important, but it is not the default mental model for TanStack-owned routing.

The maintainer skipped live interviews, so unresolved judgment calls remain in the gaps section.

## Domains

| Domain | Description | Skills |
| ------ | ----------- | ------ |
| Bootstrapping query clients | Creating stable clients and provider context | setup-query-client-and-providers |
| Reading server state | Declaring reads, query identity, observers, status, and reusable abstractions | design-query-keys-and-options, build-query-abstractions, understand-query-internals-and-observers, fetch-and-observe-queries, handle-status-and-errors |
| Coordinating query execution | Dependency, freshness, retries, pagination, prefetch | tune-defaults-freshness-retries-and-refetching, coordinate-dependent-parallel-disabled-and-background-queries, paginate-and-build-infinite-queries |
| Writing server state | Mutations, invalidation, optimistic writes, forms, cancellation | write-mutations-and-invalidate-related-queries, automatic-invalidation-after-mutations, implement-optimistic-updates-and-cache-writes, concurrent-optimistic-updates, query-data-and-forms, cancel-queries-and-consume-abort-signals |
| Shaping cache and render behavior | Seeded data, placeholders, selectors, derived state, render performance | seed-placeholder-select-and-transform-data, selectors-and-derived-state, shape-data-and-render-efficiently |
| Rendering across environments | SSR, hydration, Suspense, streaming, routers | prefetch-and-remove-request-waterfalls, compose-query-with-tanstack-router-and-start, ssr-hydration-and-streaming, use-suspense-and-error-boundaries |
| Persisting and synchronizing caches | Persistence, offline, multi-tab, realtime | persist-offline-and-restore-caches, broadcast-realtime-and-multi-tab-synchronization |
| Framework adapter idioms | Reactivity and provider rules across adapters | use-framework-adapter-reactivity |
| Operational quality | Devtools, testing, migration, linting | debug-with-devtools, test-query-code, migrate-major-versions-and-codemods, enforce-query-best-practices-with-eslint |

## Skill Inventory

| Skill | Type | Domain | What it covers | Failure modes |
| ----- | ---- | ------ | -------------- | ------------- |
| Set up QueryClient and providers | lifecycle | Bootstrapping query clients | QueryClient, providers, SSR isolation, Lit fallback | 3 |
| Design query keys and reusable options | core | Reading server state | queryKey, queryFn, queryOptions, skipToken | 3 |
| Build Query abstractions | core | Reading server state | queryOptions factories, custom hooks, usage-site composition, TypeScript inference | 3 |
| Understand Query internals and observers | core | Reading server state | QueryClient, QueryCache, QueryObserver, active/inactive queries | 3 |
| Fetch and observe queries | core | Reading server state | useQuery/createQuery/injectQuery, status, fetchStatus | 3 |
| Handle status checks and errors | framework | Reading server state | status, fetchStatus, background errors, throwOnError, cache-level callbacks | 3 |
| Tune defaults, freshness, retries, and refetching | core | Coordinating query execution | staleTime, gcTime, retry, refetch triggers, networkMode | 3 |
| Coordinate dependent, parallel, disabled, and background queries | core | Coordinating query execution | useQueries, enabled, skipToken, background fetching | 3 |
| Paginate and build infinite queries | core | Coordinating query execution | pagination, infinite queries, maxPages | 3 |
| Write mutations and invalidate related queries | core | Writing server state | mutations, invalidation, mutation state | 3 |
| Automatic invalidation after mutations | composition | Writing server state | MutationCache callbacks, mutationKey invalidation, meta tags, scoped invalidation | 3 |
| Implement optimistic updates and cache writes | core | Writing server state | onMutate, rollback, setQueryData | 3 |
| Concurrent optimistic updates | core | Writing server state | submittedAt, mutationKey filters, isMutating guards, filtered optimistic lists | 3 |
| Query data and forms | composition | Writing server state | initial form state, dirty fields, derived server/client state, reset after invalidation | 3 |
| Cancel queries and consume AbortSignals | core | Writing server state | AbortSignal, cancelQueries, CancelledError | 3 |
| Seed, placeholder, select, and transform data | core | Shaping cache and render behavior | initialData, placeholderData, select | 3 |
| Selectors and derived state | core | Shaping cache and render behavior | select, selector identity, structural sharing, render-time derivation | 3 |
| Shape data and render efficiently | framework | Shaping cache and render behavior | structural sharing, tracked props, immutable data | 3 |
| Prefetch and remove request waterfalls | lifecycle | Rendering across environments | prefetchQuery, router loaders, waterfalls | 3 |
| Compose TanStack Query with TanStack Router and Start | composition | Rendering across environments | router context, loaders, `@tanstack/react-router-ssr-query`, Start SSR/streaming | 3 |
| SSR, hydration, and streaming | lifecycle | Rendering across environments | dehydrate/hydrate, Start, Router SSR Query, RSC, SvelteKit, Nuxt | 3 |
| Use Suspense and error boundaries | framework | Rendering across environments | suspense hooks, QueryErrorResetBoundary, React.use | 3 |
| Persist offline and restore caches | composition | Persisting and synchronizing caches | persistQueryClient, persisters, restore races | 3 |
| Broadcast, realtime, and multi-tab synchronization | composition | Persisting and synchronizing caches | broadcastQueryClient, WebSockets, realtime invalidation | 3 |
| Use framework adapter reactivity | framework | Framework adapter idioms | Vue refs, Svelte runes, Angular signals, Lit controllers | 3 |
| Debug with devtools | framework | Operational quality | framework devtools, embedded panels, production imports | 3 |
| Test query code | lifecycle | Operational quality | test clients, retry false, cache isolation | 3 |
| Migrate major versions and codemods | lifecycle | Operational quality | v5 object syntax, renamed options, Svelte v6 | 3 |
| Enforce Query best practices with ESLint | composition | Operational quality | recommended configs and Query-specific rules | 3 |

## Failure Mode Inventory

| Skill | High-priority examples |
| ----- | ---------------------- |
| setup-query-client-and-providers | New client on every render; shared SSR cache between users; ambiguous Lit fallback client |
| design-query-keys-and-options | Missing variables in query key; separated key/queryFn drift; skipToken inside suspense query |
| build-query-abstractions | Custom hook is the only abstraction; wide UseQueryOptions wrapper breaks inference; wrapper hides Query result state |
| understand-query-internals-and-observers | Cache presence treated as active usage; observer-level options ignored; inactive queries expected to refetch like mounted queries |
| fetch-and-observe-queries | Void query function; only checking pending for offline state; using queries for writes |
| handle-status-and-errors | Stale data hidden on background error; validation errors sent to global boundary; duplicate toasts per observer |
| tune-defaults-freshness-retries-and-refetching | Confusing gcTime with freshness; static staleTime blocks invalidation; tests hang on retries |
| coordinate-dependent-parallel-disabled-and-background-queries | Imperative disabled query; duplicate useQueries keys; full-page spinner on background refetch |
| paginate-and-build-infinite-queries | Missing initialPageParam; overlapping infinite fetches; broken pages/pageParams shape |
| write-mutations-and-invalidate-related-queries | Multiple mutate args; per-call callbacks after unmount; not awaiting invalidation |
| automatic-invalidation-after-mutations | Invalidating whole app for every mutation; not returning invalidation; refetching data that should be static |
| implement-optimistic-updates-and-cache-writes | Optimistic write without cancellation; in-place mutation; persisted persister loses optimistic write |
| concurrent-optimistic-updates | One mutation invalidation reverts another optimistic write; filtered list mismatch; unstable pending row keys |
| query-data-and-forms | Form defaults initialized before query data; background refetch overwrites dirty state; double submit while pending |
| cancel-queries-and-consume-abort-signals | Ignoring AbortSignal; assuming unmount cancels; Suspense cancellation expected |
| seed-placeholder-select-and-transform-data | initialData overwrite assumption; v4 keepPreviousData option; throwing in select |
| selectors-and-derived-state | Effect-based derived-state sync; inline expensive select; throwing from select |
| shape-data-and-render-efficiently | Rest destructuring; query result object in hook deps; Vue v-model on immutable result |
| prefetch-and-remove-request-waterfalls | prefetchQuery expected to return data; staleTime only on prefetch; Suspense prefetch in effect |
| compose-query-with-tanstack-router-and-start | Component-only route waterfall; hand-rolled Router hydration; Next.js mental model copied into Start |
| ssr-hydration-and-streaming | RSC renders fetched data twice; suspense query not prefetched; SvelteKit query runs after response |
| use-suspense-and-error-boundaries | Disabled suspense query; missing reset boundary; query.promise without flag |
| persist-offline-and-restore-caches | gcTime shorter than maxAge; rendering before restore; missing default mutationFn |
| broadcast-realtime-and-multi-tab-synchronization | Unlocked experimental broadcast; over-normalized realtime writes; broadcast on server |
| use-framework-adapter-reactivity | Vue ref unwrapped; Svelte store syntax in v6; Angular Observable returned directly |
| debug-with-devtools | Eager production devtools; mock offline misconception; devtools outside provider |
| test-query-code | Shared test client; retry backoff in tests; asserting before async success |
| migrate-major-versions-and-codemods | v4 overload syntax; removed query callbacks; cacheTime in v5 |
| enforce-query-best-practices-with-eslint | Strict rule not enabled; infinite option order; mutation option order |

## Tensions

| Tension | Skills | Agent implication |
| ------- | ------ | ----------------- |
| Declarative cache versus imperative fetch control | coordinate-dependent-parallel-disabled-and-background-queries <-> fetch-and-observe-queries | Agents generate manual refetch flows instead of key and enabled-driven queries. |
| SSR freshness versus user data isolation | setup-query-client-and-providers <-> compose-query-with-tanstack-router-and-start <-> ssr-hydration-and-streaming <-> tune-defaults-freshness-retries-and-refetching | Agents leak server cache or double-fetch after hydration. |
| Router-owned loading versus component-only queries | prefetch-and-remove-request-waterfalls <-> compose-query-with-tanstack-router-and-start <-> ssr-hydration-and-streaming <-> understand-query-internals-and-observers | Agents recreate waterfalls, use loader data as server-state ownership, and bypass Query observer behavior. |
| Optimistic responsiveness versus server truth | implement-optimistic-updates-and-cache-writes <-> concurrent-optimistic-updates <-> write-mutations-and-invalidate-related-queries <-> persist-offline-and-restore-caches | Agents write optimistic data without cancellation, rollback, invalidation, concurrency guards, or persistence awareness. |
| Reusable abstractions versus type erasure | design-query-keys-and-options <-> build-query-abstractions <-> selectors-and-derived-state | Agents generate custom hooks or wide options wrappers that cannot run in loaders and break select inference. |
| Automatic invalidation versus scoped freshness | automatic-invalidation-after-mutations <-> write-mutations-and-invalidate-related-queries <-> tune-defaults-freshness-retries-and-refetching | Agents choose no invalidation or global invalidation without mutation keys, meta, or static-data exclusions. |
| Form client ownership versus background server freshness | query-data-and-forms <-> selectors-and-derived-state <-> write-mutations-and-invalidate-related-queries | Agents overwrite dirty form fields with refetches or disable useful background updates without acknowledging the tradeoff. |
| Framework idioms versus copied React examples | use-framework-adapter-reactivity <-> design-query-keys-and-options <-> ssr-hydration-and-streaming | Agents port React examples without preserving adapter reactivity. |

## Cross-References

| From | To | Reason |
| ---- | -- | ------ |
| setup-query-client-and-providers | ssr-hydration-and-streaming | Client lifetime differs between browser and server. |
| design-query-keys-and-options | enforce-query-best-practices-with-eslint | Lint rules encode key and options mistakes. |
| design-query-keys-and-options | build-query-abstractions | Options factories are the base abstraction for reusable keys and query functions. |
| fetch-and-observe-queries | tune-defaults-freshness-retries-and-refetching | Status behavior depends on defaults and network mode. |
| fetch-and-observe-queries | handle-status-and-errors | Status, fetchStatus, background errors, and throwOnError drive UI behavior. |
| fetch-and-observe-queries | understand-query-internals-and-observers | Hooks create QueryObservers, while QueryClient reads only inspect cache. |
| write-mutations-and-invalidate-related-queries | implement-optimistic-updates-and-cache-writes | Optimistic updates are mutation side effects. |
| write-mutations-and-invalidate-related-queries | automatic-invalidation-after-mutations | App-level invalidation policies build on mutation keys and MutationCache callbacks. |
| implement-optimistic-updates-and-cache-writes | cancel-queries-and-consume-abort-signals | Optimistic writes often need cancellation first. |
| implement-optimistic-updates-and-cache-writes | concurrent-optimistic-updates | Concurrent writes need submittedAt identity, mutationKey scoping, and guarded invalidation. |
| seed-placeholder-select-and-transform-data | ssr-hydration-and-streaming | initialData has SSR tradeoffs compared to hydration. |
| seed-placeholder-select-and-transform-data | selectors-and-derived-state | select is both a transformation hook and a fine-grained subscription mechanism. |
| selectors-and-derived-state | query-data-and-forms | Forms often need derived server-plus-client state instead of effect-based synchronization. |
| build-query-abstractions | selectors-and-derived-state | Query abstractions should preserve usage-site select inference. |
| prefetch-and-remove-request-waterfalls | compose-query-with-tanstack-router-and-start | Router and Start loaders are the highest-priority route prefetch surface in the TanStack ecosystem. |
| compose-query-with-tanstack-router-and-start | ssr-hydration-and-streaming | Router SSR Query integration owns cache handoff and streamed query results. |
| compose-query-with-tanstack-router-and-start | use-suspense-and-error-boundaries | Suspense queries and loader prefetches participate in Router SSR/streaming differently than plain useQuery. |
| shape-data-and-render-efficiently | enforce-query-best-practices-with-eslint | Lint rules protect tracked render behavior. |
| persist-offline-and-restore-caches | tune-defaults-freshness-retries-and-refetching | Persistence depends on gcTime, networkMode, and retry. |
| use-framework-adapter-reactivity | design-query-keys-and-options | Adapter reactivity usually flows through keys and option thunks. |
| migrate-major-versions-and-codemods | design-query-keys-and-options | v5 changed hooks and client methods to object options. |

## Subsystems & Reference Candidates

| Skill | Subsystems | Reference candidates |
| ----- | ---------- | -------------------- |
| design-query-keys-and-options | framework option helpers | queryOptions/infiniteQueryOptions/mutationOptions per adapter |
| build-query-abstractions | queryOptions factories, custom hook wrappers, TypeScript inference | wrong/correct abstraction examples from TKDodo #31 |
| understand-query-internals-and-observers | QueryClient, QueryCache, Query, QueryObserver, MutationCache | active/inactive observer mental model |
| handle-status-and-errors | status, fetchStatus, throwOnError, QueryCache callbacks | stale-data-first status recipes and background error toast policies |
| query-data-and-forms | form initial values, dirty state, mutation submit/reset | initial-only versus derived-state form recipes |
| automatic-invalidation-after-mutations | MutationCache, mutationKey, meta, matchQuery | global invalidation policies and static-data exclusions |
| concurrent-optimistic-updates | submittedAt, mutationKey, isMutating, useMutationState | concurrent rollback and over-invalidation recipes |
| selectors-and-derived-state | select, stable selectors, structural sharing, derived client state | selector identity and render-time derivation recipes |
| compose-query-with-tanstack-router-and-start | TanStack Start, TanStack Router, Router SSR Query integration | route loader, router context QueryClient, setupRouterSsrQueryIntegration, Start server function references |
| ssr-hydration-and-streaming | TanStack Start, TanStack Router SSR Query, Next pages, Next app router, Nuxt, SvelteKit, SolidStart, Lit SSR | dehydrate/hydrate recipes by framework |
| persist-offline-and-restore-caches | async persister, sync persister, fine-grained persister, framework providers | persister storage and retry interfaces |
| use-framework-adapter-reactivity | React/Preact, Vue, Solid, Svelte, Angular, Lit | adapter mapping tables and reactivity rules |
| debug-with-devtools | React, Preact, Vue, Solid, Svelte, Angular | import paths and production-lazy setup |
| enforce-query-best-practices-with-eslint | recommended, recommended-strict, custom rules | rule-specific wrong/correct examples |

## Recommended Skill File Structure

- Core skills: `design-query-keys-and-options`, `build-query-abstractions`, `understand-query-internals-and-observers`, `fetch-and-observe-queries`, `tune-defaults-freshness-retries-and-refetching`, `coordinate-dependent-parallel-disabled-and-background-queries`, `paginate-and-build-infinite-queries`, `write-mutations-and-invalidate-related-queries`, `implement-optimistic-updates-and-cache-writes`, `concurrent-optimistic-updates`, `cancel-queries-and-consume-abort-signals`, `seed-placeholder-select-and-transform-data`, `selectors-and-derived-state`.
- Framework skills: `handle-status-and-errors`, `use-framework-adapter-reactivity`, `shape-data-and-render-efficiently`, `use-suspense-and-error-boundaries`, `debug-with-devtools`.
- Lifecycle skills: `setup-query-client-and-providers`, `prefetch-and-remove-request-waterfalls`, `ssr-hydration-and-streaming`, `test-query-code`, `migrate-major-versions-and-codemods`.
- Composition skills: `compose-query-with-tanstack-router-and-start`, `query-data-and-forms`, `automatic-invalidation-after-mutations`, `persist-offline-and-restore-caches`, `broadcast-realtime-and-multi-tab-synchronization`, `enforce-query-best-practices-with-eslint`.
- Reference files: per-adapter API mapping, SSR recipes, persistence recipes, ESLint rule examples, migration wrong/correct pairs, TKDodo source index.

## Composition Opportunities

| Library | Integration points | Composition skill needed? |
| ------- | ------------------ | ------------------------- |
| TanStack Start | routes, server functions, SSR, streaming, Query integration via Router | yes |
| TanStack Router | route loaders, prefetch, cache handoff, `@tanstack/react-router-ssr-query` | yes |
| React Router | loaders and query cache seeding | yes |
| Next.js | app router, pages router, streaming | yes |
| Remix | loaders and hydration | yes |
| Nuxt | Vue Query SSR plugin and onServerPrefetch | yes |
| SvelteKit | load functions, browser gating, prefetchQuery | yes |
| SolidStart | SSR and route-level prefetch | yes |
| Angular HttpClient | Observable to Promise conversion | yes |
| GraphQL clients | queryFn and cancellation integration | maybe |
| WebSocket clients | event-driven invalidation and cache updates | maybe |
| AsyncStorage/localStorage/IndexedDB | persister storage backends | yes |

## Source Priority Notes

- In-repo docs read: all 493 markdown files under `docs/`, plus root README and package manifests.
- Published docs priority source: `docs/config.json`, especially the `Guides & Concepts` order.
- TKDodo priority source: React Query series order on `https://tkdodo.eu/blog/tan-stack-router-and-query` now lists 33 parts, with "TanStack Router and Query" as #32. Cross-checked gaps are recorded in `_artifacts/tkdodo_cross_check.md`.

## Remaining Gaps

| Skill | Question | Status |
| ----- | -------- | ------ |
| compose-query-with-tanstack-router-and-start | Should this composition skill be generated in Query, Router, Start, or all three with cross-links? | open |
| broadcast-realtime-and-multi-tab-synchronization | Which realtime patterns should be blessed as skills versus examples only? | open |
| use-framework-adapter-reactivity | Cross-framework skill with references, or package-local adapter skills? | open |
| ssr-hydration-and-streaming | Include or exclude experimental streamed APIs? | open |
| migrate-major-versions-and-codemods | How far back should generated migration skills go? | open |
| enforce-query-best-practices-with-eslint | Should ESLint skills be React-only or cross-adapter where rules apply? | open |
