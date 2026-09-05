# @tanstack/query-core

## 5.102.9

### Patch Changes

- [#11332](https://github.com/TanStack/query/pull/11332) [`fdae2ce`](https://github.com/TanStack/query/commit/fdae2ce4e5382af7326c7c38ce5d5a12751ada12) - Reuse the shared query option resolver for refetch intervals to reduce bundle size.

## 5.102.8

## 5.102.7

## 5.102.6

## 5.102.5

### Patch Changes

- [#11302](https://github.com/TanStack/query/pull/11302) [`578e5c2`](https://github.com/TanStack/query/commit/578e5c26e8ebd0d7351b4b8e2bafba695e672b8d) - Reduce the Query Core bundle size by removing unused symbol descriptions and
  simplifying internal helpers.

## 5.102.4

### Patch Changes

- [#11293](https://github.com/TanStack/query/pull/11293) [`a05df6a`](https://github.com/TanStack/query/commit/a05df6aefb0e2489ec2c879ae16e2ee7cb3123ec) - Avoid scheduling stale timeouts for disabled query observers.

## 5.102.3

## 5.102.2

### Patch Changes

- [#11263](https://github.com/TanStack/query/pull/11263) [`80fbf73`](https://github.com/TanStack/query/commit/80fbf73e77892d702c107e14a84c219a8ed825dc) - Export MutationCacheConfig and QueryCacheConfig.

## 5.102.1

### Patch Changes

- [#11260](https://github.com/TanStack/query/pull/11260) [`134890d`](https://github.com/TanStack/query/commit/134890dbdc60e4fb0313e44b512d29284ca82f96) - Type hydration input as a partial dehydrated state so omitted mutation and query collections are supported.

## 5.102.0

### Minor Changes

- [#10658](https://github.com/TanStack/query/pull/10658) [`c6fc17c`](https://github.com/TanStack/query/commit/c6fc17cfad6e452261c585fabfb8c210e60531ed) - add query and infiniteQuery methods, deprecate old imperative methods

### Patch Changes

- [#11161](https://github.com/TanStack/query/pull/11161) [`34f7cee`](https://github.com/TanStack/query/commit/34f7ceed09c10e4a3aa2df31a106ddf02ec4e787) - fix(query-core): clear a stale `select` error when the observer switches to a query without data, and reset `isPlaceholderData` on select-error results to match the declared result types, so a previous query's select error no longer leaks into the new result

- [#11253](https://github.com/TanStack/query/pull/11253) [`b4368c4`](https://github.com/TanStack/query/commit/b4368c43792349f6c29d1fb41f7ee1ef3a8bdd2c) - Improve hydration performance by skipping no-op data transforms and default error-redaction callbacks.
  Export dehydrateQuery.

- [#11214](https://github.com/TanStack/query/pull/11214) [`5bb089d`](https://github.com/TanStack/query/commit/5bb089d153d33933983b7ea80f8d69b51d423698) - Reduce observer churn overhead by removing observers in place instead of copying the observer list for every unsubscribe.

- [#11011](https://github.com/TanStack/query/pull/11011) [`ba4650c`](https://github.com/TanStack/query/commit/ba4650c05e61e33c609e051b948c9f7d31ce70d1) - fix(query-core): reset `isPlaceholderData` when `select` throws on placeholder data

- [#11224](https://github.com/TanStack/query/pull/11224) [`294d4e6`](https://github.com/TanStack/query/commit/294d4e62c4f7d674574a4903eef2a1bc3dd1413b) - Fix `queryOptions` and `infiniteQueryOptions` return types so exported inferred options can be emitted in declaration files without leaking internal data tag symbols.

- [#11225](https://github.com/TanStack/query/pull/11225) [`1f631b3`](https://github.com/TanStack/query/commit/1f631b3604aab6567fb3f6c90646a5a304641546) - Skip unused result tracking when notifying `useQueries` listeners without a `combine` function.

- [#11215](https://github.com/TanStack/query/pull/11215) [`01a02bf`](https://github.com/TanStack/query/commit/01a02bfad32f9efbc17796be31d6399f1197a655) - Avoid repeatedly synchronizing the same tracked property across all observers in `useQueries`.

- [#11172](https://github.com/TanStack/query/pull/11172) [`18c1c1e`](https://github.com/TanStack/query/commit/18c1c1ef94883e781ad36d36f9ea4a043ce4260b) - Reattach `MutationObserver` to its current mutation when a listener subscribes again, so a `useMutation` result no longer stays `pending` after React tears down and re-establishes the subscription mid-mutation.

- [#11128](https://github.com/TanStack/query/pull/11128) [`5448063`](https://github.com/TanStack/query/commit/5448063f828d2270dccd41ae375e1afde35e91f2) - Ignore a retained `pendingThenable` settlement callback invoked after the thenable has settled. Holding a reference to `resolve`/`reject` and calling it later used to overwrite `status` and `reason` even though the underlying promise had already settled, leaving the thenable advertising a state that disagreed with its value.

- [#8737](https://github.com/TanStack/query/pull/8737) [`2215bb0`](https://github.com/TanStack/query/commit/2215bb031139cdc8a84751b37a485c38ca9d2b6e) - fix: make mutation variables optional when `undefined extends TVariables`

- [#11221](https://github.com/TanStack/query/pull/11221) [`1ef4208`](https://github.com/TanStack/query/commit/1ef42087c9a266c2137d2ef645cbcc662f60ac93) - Remove experimental render-time prefetching and the `promise` property from query results.

- [#11218](https://github.com/TanStack/query/pull/11218) [`5981771`](https://github.com/TanStack/query/commit/5981771abec9330b344a2617543eb05ba7c99e24) - Release a mutation's retryer once its execution settles, so the settled promise no longer keeps that mutation's result, variables and context in memory for as long as the mutation cache retains it.

- [#11163](https://github.com/TanStack/query/pull/11163) [`4a9bef6`](https://github.com/TanStack/query/commit/4a9bef6cf19b1cd6b014032d696129f12a848185) - Release a query's retryer once its fetch settles, so the settled promise no longer keeps that fetch's raw result in memory alongside the structurally shared `state.data` (or after the query is reset or removed).

- [#11036](https://github.com/TanStack/query/pull/11036) [`bef4bc7`](https://github.com/TanStack/query/commit/bef4bc780ce7cca32b7e3dea85f77d92f82a62a2) - Resolve suspense when query data is set programmatically via setQueryData or streamedQuery. Previously, fetchOptimistic returned only the fetch promise, which left the Suspense boundary stuck until the queryFn completed — even when data already existed in the cache. The fix uses Promise.race with a cache subscriber to release suspense as soon as data becomes available.

- [#11234](https://github.com/TanStack/query/pull/11234) [`9656dc4`](https://github.com/TanStack/query/commit/9656dc4e5fef5f8c502579b52459f9e8c72e787c) - Notify every query observer when another observer unsubscribes synchronously during the same query update.

- [#11211](https://github.com/TanStack/query/pull/11211) [`326aaf1`](https://github.com/TanStack/query/commit/326aaf1333e5d9cbc46569c53f218d31684162d2) - fix: resetQueries now preserves the queries matched before query.reset() changes their state.

- [#11065](https://github.com/TanStack/query/pull/11065) [`3e83601`](https://github.com/TanStack/query/commit/3e836010032c2586e9f1c66a271fa9114a6401f9) - Memoize falsy `combine` results when the function and query results are unchanged.

## 5.101.4

## 5.101.3

### Patch Changes

- [#11084](https://github.com/TanStack/query/pull/11084) [`7e3c822`](https://github.com/TanStack/query/commit/7e3c822a10896f41a8f1031c16b85096277af677) - Improve `partialMatchKey` performance in query-core.

## 5.101.2

## 5.101.1

### Patch Changes

- [#10610](https://github.com/TanStack/query/pull/10610) [`9eff92e`](https://github.com/TanStack/query/commit/9eff92ed86e284ec0125b3a3539d028688235bd1) - fix missing `dataUpdatedAt` for streamed queries that resolve before hydration

## 5.101.0

## 5.100.14

## 5.100.13

### Patch Changes

- fix(query-core): drop the custom `NoInfer<T>` re-export and rely on TypeScript's built-in `NoInfer` (TS ≥ 5.4) so `NoInfer<X[K]>` stays assignable to `X[K]` in generic contexts (fixes [#9937](https://github.com/TanStack/query/issues/9937)) ([#10593](https://github.com/TanStack/query/pull/10593))

## 5.100.12

## 5.100.11

## 5.100.10

## 5.100.9

### Patch Changes

- fix(query-core): wrap `persister`'s `TQueryKey` in `NoInfer` so that the `persister` slot no longer contributes to `TQueryKey` inference. Follow-up to #10510, which removed `NoInfer` on all three `persister` generics. Preserving `NoInfer<TQueryKey>` keeps that fix's benefit for `TQueryFnData` while preventing `TQueryKey` from widening to the augmented constraint when `Register.queryKey` is narrowed — which made `DataTag`-branded wrapper returns un-assignable in contravariant slots. ([#10601](https://github.com/TanStack/query/pull/10601))

## 5.100.8

## 5.100.7

## 5.100.6

## 5.100.5

### Patch Changes

- fix(core): propagate AbortSignal reason in infinite queries ([`a53ef97`](https://github.com/TanStack/query/commit/a53ef97f87decb8ea2431710f5199431d3c94c8d))

## 5.100.4

## 5.100.3

### Patch Changes

- fix(suspense): skip calling combine when queries would suspend ([#10576](https://github.com/TanStack/query/pull/10576))

## 5.100.2

### Patch Changes

- fix(query-core): allow `persister` to contribute to `TQueryFnData` inference so a `queryFn` that declares a parameter no longer produces a spurious overload mismatch against a typed persister (#7842). ([#10510](https://github.com/TanStack/query/pull/10510))

- fix: preserve infinite query behavior during SSR hydration (#8825) ([#10074](https://github.com/TanStack/query/pull/10074))

- ref(core): remove leftover setStateOptions ([#10574](https://github.com/TanStack/query/pull/10574))

## 5.100.1

### Patch Changes

- Fix bugs where hydrating queries with promises that had already resolved could cause queries to briefly and incorrectly show as pending/fetching ([#10444](https://github.com/TanStack/query/pull/10444))

## 5.100.0

### Minor Changes

- feat(query-core): accept callback function for retryOnMount ([#10515](https://github.com/TanStack/query/pull/10515))

## 5.99.2

## 5.99.1

## 5.99.0

## 5.98.0

## 5.97.0

### Patch Changes

- fix(query-core): use explicit `undefined` check for timer IDs so that custom `TimeoutProvider`s returning `0` as a valid timer ID are properly cleared ([#10401](https://github.com/TanStack/query/pull/10401))

## 5.96.2

## 5.96.1

## 5.96.0

## 5.95.2

### Patch Changes

- fix(timeoutManager): make sure NodeJs.Timout doesn't leak ([#10325](https://github.com/TanStack/query/pull/10325))

## 5.95.1

### Patch Changes

- fix(timeoutManager): make sure NodeJs.Timout doesn't leak ([#10323](https://github.com/TanStack/query/pull/10323))

## 5.95.0

## 5.94.5

### Patch Changes

- fix(\*): resolve issue about excluded build directory ([#10312](https://github.com/TanStack/query/pull/10312))

## 5.94.4

### Patch Changes

- chore: fixed version ([#10064](https://github.com/TanStack/query/pull/10064))

## 5.91.2

### Patch Changes

- fix(streamedQuery): maintain error state on reset refetch with initialData defined ([#10287](https://github.com/TanStack/query/pull/10287))

## 5.91.1

### Patch Changes

- fix(core): cancel paused initial fetch when last observer unsubscribes ([#10291](https://github.com/TanStack/query/pull/10291))

## 5.91.0

### Minor Changes

- feat: environmentManager ([#10199](https://github.com/TanStack/query/pull/10199))

## 5.90.20

### Patch Changes

- Fix: onMutate callback now runs synchronously when mutationCache.config.onMutate is not defined ([#10066](https://github.com/TanStack/query/pull/10066))

## 5.90.19

### Patch Changes

- fix stable combine reference not updating when queries change dynamically ([#9954](https://github.com/TanStack/query/pull/9954))

## 5.90.18

### Patch Changes

- Align experimental_prefetchInRender promise rejection with Suspense behavior by only throwing when no data is available. ([#10025](https://github.com/TanStack/query/pull/10025))

## 5.90.17

### Patch Changes

- fix(query-core): replaceEqualDeep max depth ([#10032](https://github.com/TanStack/query/pull/10032))

## 5.90.16

### Patch Changes

- fix useQueries race condition on queries length change (#9971) ([#9973](https://github.com/TanStack/query/pull/9973))

## 5.90.15

### Patch Changes

- Fix: Always treat existing data as stale when query goes into error state. ([#9927](https://github.com/TanStack/query/pull/9927))

## 5.90.14

### Patch Changes

- Fix streamedQuery reducer being called twice ([#9970](https://github.com/TanStack/query/pull/9970))

## 5.90.13

### Patch Changes

- Made context.signal consume aware with streamedQuery ([#9963](https://github.com/TanStack/query/pull/9963))

## 5.90.12

### Patch Changes

- fix: update react and nextJs ([#9944](https://github.com/TanStack/query/pull/9944))

## 5.90.11

### Patch Changes

- Prevent infinite render loops when useSuspenseQueries has duplicate queryKeys ([#9886](https://github.com/TanStack/query/pull/9886))

## 5.90.10

### Patch Changes

- fix(types): allow QueryFilters union with different lengths ([#9878](https://github.com/TanStack/query/pull/9878))

- Fix streamedQuery to avoid returning undefined when the stream yields no values ([#9876](https://github.com/TanStack/query/pull/9876))

## 5.90.9

### Patch Changes

- fix(types): do not drop readonly for partial QueryFilter matching ([#9872](https://github.com/TanStack/query/pull/9872))

## 5.90.8

### Patch Changes

- fix: allow partial query keys in `QueryFilters` ([#9686](https://github.com/TanStack/query/pull/9686))

## 5.90.7

### Patch Changes

- fix(core): only attach .then and .catch onto a promise if it gets dehydrated ([#9847](https://github.com/TanStack/query/pull/9847))

## 5.90.6

### Patch Changes

- Fixed isFetchedAfterMount in cases where initialData is applied ([#9743](https://github.com/TanStack/query/pull/9743))

## 5.90.5

### Patch Changes

- fix: observing "promise" needs to implicitly observe "data" ([#9772](https://github.com/TanStack/query/pull/9772))

## 5.90.4

### Patch Changes

- fix(types): remove duplicate Array condition in MutationKey type ([#9754](https://github.com/TanStack/query/pull/9754))

## 5.90.3

### Patch Changes

- Avoid unhandled promise rejection errors during de/rehydration of pending queries. ([#9752](https://github.com/TanStack/query/pull/9752))
