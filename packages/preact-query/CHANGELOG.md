# @tanstack/preact-query

## 5.102.9

### Patch Changes

- Updated dependencies [[`fdae2ce`](https://github.com/TanStack/query/commit/fdae2ce4e5382af7326c7c38ce5d5a12751ada12)]:
  - @tanstack/query-core@5.102.9

## 5.102.8

### Patch Changes

- [#11315](https://github.com/TanStack/query/pull/11315) [`6c27607`](https://github.com/TanStack/query/commit/6c27607d7ffc87612a8f1222a95f28bf5f9a045e) - fix(preact-query/useQueries): keep unsubscribed idle

- Updated dependencies []:
  - @tanstack/query-core@5.102.8

## 5.102.7

### Patch Changes

- [#11309](https://github.com/TanStack/query/pull/11309) [`67fddee`](https://github.com/TanStack/query/commit/67fddee6310ca0dd87749ed7a1b4a7178c6e6aae) - fix(preact-query): propagate falsy errors to the error boundary

- Updated dependencies []:
  - @tanstack/query-core@5.102.7

## 5.102.6

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.102.6

## 5.102.5

### Patch Changes

- Updated dependencies [[`578e5c2`](https://github.com/TanStack/query/commit/578e5c26e8ebd0d7351b4b8e2bafba695e672b8d)]:
  - @tanstack/query-core@5.102.5

## 5.102.4

### Patch Changes

- Updated dependencies [[`a05df6a`](https://github.com/TanStack/query/commit/a05df6aefb0e2489ec2c879ae16e2ee7cb3123ec)]:
  - @tanstack/query-core@5.102.4

## 5.102.3

### Patch Changes

- [#11274](https://github.com/TanStack/query/pull/11274) [`714c285`](https://github.com/TanStack/query/commit/714c2856e09bbaf7448ccc02364887e36c18b37c) - fix(preact-query/usePrefetchQuery): replace deprecated `queryClient.fetchQuery` with `queryClient.query`

- Updated dependencies []:
  - @tanstack/query-core@5.102.3

## 5.102.2

### Patch Changes

- Updated dependencies [[`80fbf73`](https://github.com/TanStack/query/commit/80fbf73e77892d702c107e14a84c219a8ed825dc)]:
  - @tanstack/query-core@5.102.2

## 5.102.1

### Patch Changes

- Updated dependencies [[`134890d`](https://github.com/TanStack/query/commit/134890dbdc60e4fb0313e44b512d29284ca82f96)]:
  - @tanstack/query-core@5.102.1

## 5.102.0

### Minor Changes

- [#10669](https://github.com/TanStack/query/pull/10669) [`4e48c58`](https://github.com/TanStack/query/commit/4e48c581b70216e9c66a72cc328b61789194db4f) - preact-query: update usePrefetchQuery and usePrefetchInfiniteQuery to use queryClient.query and queryClient.infiniteQuery

### Patch Changes

- [#11245](https://github.com/TanStack/query/pull/11245) [`37127db`](https://github.com/TanStack/query/commit/37127dbe479a4892dbbe28ac8ceabf8832b5f1a3) - revert: remove NoInfer from useQuery return types

- [#10373](https://github.com/TanStack/query/pull/10373) [`6e3d521`](https://github.com/TanStack/query/commit/6e3d521fe54f78624e53c1c6f9cadd678504bee8) - fix(types): propagate generic type parameters to `useMutationState` select callback

- [#11224](https://github.com/TanStack/query/pull/11224) [`294d4e6`](https://github.com/TanStack/query/commit/294d4e62c4f7d674574a4903eef2a1bc3dd1413b) - Fix `queryOptions` and `infiniteQueryOptions` return types so exported inferred options can be emitted in declaration files without leaking internal data tag symbols.

- [#11147](https://github.com/TanStack/query/pull/11147) [`cb6c9d3`](https://github.com/TanStack/query/commit/cb6c9d3725db0fed94fb5133820e41b7c326d2ef) - Default `TData` of `UseInfiniteQueryOptions` and `UseSuspenseInfiniteQueryOptions` to `InfiniteData<TQueryFnData>` so it matches the hook generics.

- [#8737](https://github.com/TanStack/query/pull/8737) [`2215bb0`](https://github.com/TanStack/query/commit/2215bb031139cdc8a84751b37a485c38ca9d2b6e) - fix: make mutation variables optional when `undefined extends TVariables`

- [#11166](https://github.com/TanStack/query/pull/11166) [`4913802`](https://github.com/TanStack/query/commit/49138028953f38097cfac4a6e9843c987705325f) - Evaluate a function-form `throwOnError` against the actual query error before disabling `retryOnMount` (port of [#9338](https://github.com/TanStack/query/issues/9338)), so errored queries whose `throwOnError` returns `false` are retried on mount again.

- [#11221](https://github.com/TanStack/query/pull/11221) [`1ef4208`](https://github.com/TanStack/query/commit/1ef42087c9a266c2137d2ef645cbcc662f60ac93) - Remove experimental render-time prefetching and the `promise` property from query results.

- [#11233](https://github.com/TanStack/query/pull/11233) [`b866a95`](https://github.com/TanStack/query/commit/b866a95adde7e8465462526df5870ebc12340b36) - remove unused experimental_beforeQuery and experimental_afterQuery hooks

- [#11144](https://github.com/TanStack/query/pull/11144) [`e546d03`](https://github.com/TanStack/query/commit/e546d03bef116c66a05dbf42ccfd70b6d8600a8f) - fix: remove placeholderData from suspense infinite query

- Updated dependencies [[`34f7cee`](https://github.com/TanStack/query/commit/34f7ceed09c10e4a3aa2df31a106ddf02ec4e787), [`b4368c4`](https://github.com/TanStack/query/commit/b4368c43792349f6c29d1fb41f7ee1ef3a8bdd2c), [`5bb089d`](https://github.com/TanStack/query/commit/5bb089d153d33933983b7ea80f8d69b51d423698), [`ba4650c`](https://github.com/TanStack/query/commit/ba4650c05e61e33c609e051b948c9f7d31ce70d1), [`294d4e6`](https://github.com/TanStack/query/commit/294d4e62c4f7d674574a4903eef2a1bc3dd1413b), [`1f631b3`](https://github.com/TanStack/query/commit/1f631b3604aab6567fb3f6c90646a5a304641546), [`01a02bf`](https://github.com/TanStack/query/commit/01a02bfad32f9efbc17796be31d6399f1197a655), [`18c1c1e`](https://github.com/TanStack/query/commit/18c1c1ef94883e781ad36d36f9ea4a043ce4260b), [`5448063`](https://github.com/TanStack/query/commit/5448063f828d2270dccd41ae375e1afde35e91f2), [`2215bb0`](https://github.com/TanStack/query/commit/2215bb031139cdc8a84751b37a485c38ca9d2b6e), [`1ef4208`](https://github.com/TanStack/query/commit/1ef42087c9a266c2137d2ef645cbcc662f60ac93), [`5981771`](https://github.com/TanStack/query/commit/5981771abec9330b344a2617543eb05ba7c99e24), [`4a9bef6`](https://github.com/TanStack/query/commit/4a9bef6cf19b1cd6b014032d696129f12a848185), [`bef4bc7`](https://github.com/TanStack/query/commit/bef4bc780ce7cca32b7e3dea85f77d92f82a62a2), [`9656dc4`](https://github.com/TanStack/query/commit/9656dc4e5fef5f8c502579b52459f9e8c72e787c), [`326aaf1`](https://github.com/TanStack/query/commit/326aaf1333e5d9cbc46569c53f218d31684162d2), [`3e83601`](https://github.com/TanStack/query/commit/3e836010032c2586e9f1c66a271fa9114a6401f9), [`c6fc17c`](https://github.com/TanStack/query/commit/c6fc17cfad6e452261c585fabfb8c210e60531ed)]:
  - @tanstack/query-core@5.102.0

## 5.101.4

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.101.4

## 5.101.3

### Patch Changes

- Updated dependencies [[`7e3c822`](https://github.com/TanStack/query/commit/7e3c822a10896f41a8f1031c16b85096277af677)]:
  - @tanstack/query-core@5.101.3

## 5.101.2

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.101.2

## 5.101.1

### Patch Changes

- Updated dependencies [[`9eff92e`](https://github.com/TanStack/query/commit/9eff92ed86e284ec0125b3a3539d028688235bd1)]:
  - @tanstack/query-core@5.101.1

## 5.101.0

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.101.0

## 5.100.14

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.14

## 5.100.13

### Patch Changes

- Updated dependencies [[`d423168`](https://github.com/TanStack/query/commit/d423168f6261a5cb3d353e53b27c8150cc271151)]:
  - @tanstack/query-core@5.100.13

## 5.100.12

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.12

## 5.100.11

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.11

## 5.100.10

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.10

## 5.100.9

### Patch Changes

- Updated dependencies [[`fcee7bd`](https://github.com/TanStack/query/commit/fcee7bdc429385ae8ffa224fa8a7a9ec7b8ee380)]:
  - @tanstack/query-core@5.100.9

## 5.100.8

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.8

## 5.100.7

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.7

## 5.100.6

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.6

## 5.100.5

### Patch Changes

- Updated dependencies [[`a53ef97`](https://github.com/TanStack/query/commit/a53ef97f87decb8ea2431710f5199431d3c94c8d)]:
  - @tanstack/query-core@5.100.5

## 5.100.4

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.4

## 5.100.3

### Patch Changes

- Updated dependencies [[`f85d825`](https://github.com/TanStack/query/commit/f85d825e02efbbff02e2081528ed28f5e5382f7a)]:
  - @tanstack/query-core@5.100.3

## 5.100.2

### Patch Changes

- Updated dependencies [[`ea4497e`](https://github.com/TanStack/query/commit/ea4497e8aa00d8c1c3a36fb1e17563a889d6ab31), [`d6a7bf3`](https://github.com/TanStack/query/commit/d6a7bf3e3e024c1a77d0536813238cc8007a5fa7), [`645d5d1`](https://github.com/TanStack/query/commit/645d5d130f5e8017cb1bf1a37987f7b980aed705)]:
  - @tanstack/query-core@5.100.2

## 5.100.1

### Patch Changes

- Updated dependencies [[`1bb0d23`](https://github.com/TanStack/query/commit/1bb0d234280fd4ae1725c439088426a20593a8df)]:
  - @tanstack/query-core@5.100.1

## 5.100.0

### Patch Changes

- Updated dependencies [[`6540a41`](https://github.com/TanStack/query/commit/6540a4126b1c087d86d64525e78f32d9920dcd31)]:
  - @tanstack/query-core@5.100.0

## 5.99.2

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.99.2

## 5.99.1

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.99.1

## 5.99.0

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.99.0

## 5.98.0

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.98.0

## 5.97.0

### Patch Changes

- Updated dependencies [[`2bfb12c`](https://github.com/TanStack/query/commit/2bfb12cc44f1d8495106136e4ddacb817135f8f9)]:
  - @tanstack/query-core@5.97.0

## 5.96.2

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.96.2

## 5.96.1

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.96.1

## 5.96.0

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.96.0

## 5.95.2

### Patch Changes

- Updated dependencies [[`cd5a35b`](https://github.com/TanStack/query/commit/cd5a35b328837781aa4f9305bb2bd7877ca934e9)]:
  - @tanstack/query-core@5.95.2

## 5.95.1

### Patch Changes

- Updated dependencies [[`1f1775c`](https://github.com/TanStack/query/commit/1f1775ca92f2b6c035682947ff3b3424804ff31a)]:
  - @tanstack/query-core@5.95.1

## 5.95.0

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.95.0

## 5.94.5

### Patch Changes

- fix(\*): resolve issue about excluded build directory ([#10312](https://github.com/TanStack/query/pull/10312))

- Updated dependencies [[`4b6536d`](https://github.com/TanStack/query/commit/4b6536dfce99036f4e37f52943c6fed3ad0e0a18)]:
  - @tanstack/query-core@5.94.5

## 5.94.4

### Patch Changes

- chore: fixed version ([#10064](https://github.com/TanStack/query/pull/10064))

- Updated dependencies [[`4c75210`](https://github.com/TanStack/query/commit/4c75210ce8235fe3d39b67e1029eff11278927cc)]:
  - @tanstack/query-core@5.94.4

## 5.94.3

### Patch Changes

- fix: stop node types from leaking into browser ([#10302](https://github.com/TanStack/query/pull/10302))

## 5.94.2

### Patch Changes

- fix(streamedQuery): maintain error state on reset refetch with initialData defined ([#10287](https://github.com/TanStack/query/pull/10287))

- Updated dependencies [[`248975e`](https://github.com/TanStack/query/commit/248975e896f585f6eaa505c796e73fcf7bfd1eec)]:
  - @tanstack/query-core@5.91.2

## 5.94.1

### Patch Changes

- fix(core): cancel paused initial fetch when last observer unsubscribes ([#10291](https://github.com/TanStack/query/pull/10291))

- Updated dependencies [[`a89aab9`](https://github.com/TanStack/query/commit/a89aab975581c25c113a26c8af486b4cafad272a)]:
  - @tanstack/query-core@5.91.1

## 5.94.0

### Minor Changes

- feat: environmentManager ([#10199](https://github.com/TanStack/query/pull/10199))

### Patch Changes

- Updated dependencies [[`6fa901b`](https://github.com/TanStack/query/commit/6fa901b97a22a80d0fca3f6ed86237ff0cbdd13b)]:
  - @tanstack/query-core@5.91.0

## 5.93.0

### Minor Changes

- feat: Add preact persist plugin ([#10120](https://github.com/TanStack/query/pull/10120))

## 5.92.0

### Minor Changes

- feat: Add preact query devtools ([#10119](https://github.com/TanStack/query/pull/10119))

## 5.91.1

### Patch Changes

- refactor(preact-query/useQueries): remove unreachable 'willFetch' branch in suspense promise collection ([#10188](https://github.com/TanStack/query/pull/10188))

## 5.91.0

### Minor Changes

- feat: Preact Adapter ([#9935](https://github.com/TanStack/query/pull/9935))
