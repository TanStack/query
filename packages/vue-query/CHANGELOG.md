# @tanstack/vue-query

## 5.99.2

### Patch Changes

- fix(vue-query): allow computed ref and other reactive values as `enabled` property in queryOptions ([#10465](https://github.com/TanStack/query/pull/10465))

  This fixes a regression introduced in #10452 where `queryOptions` only accepted getter functions for the `enabled` property, but not `computed` refs or other reactive values.

  Now the `enabled` property in `queryOptions` correctly accepts:
  - `boolean` values
  - `Ref<boolean>`
  - `ComputedRef<boolean>`
  - `() => boolean` getter functions
  - `(query) => boolean` query predicate functions

- Updated dependencies []:
  - @tanstack/query-core@5.99.2

## 5.99.1

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.99.1

## 5.99.0

### Minor Changes

- feat(vue-query): add 'mutationOptions' ([#10381](https://github.com/TanStack/query/pull/10381))

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.99.0

## 5.98.0

### Minor Changes

- Add usePrefetchQuery and usePrefetchInfiniteQuery to vue-query. ([#10372](https://github.com/TanStack/query/pull/10372))

### Patch Changes

- fix(vue-query): fix type of queryOptions to allow plain properies or getters ([#10452](https://github.com/TanStack/query/pull/10452))

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

## 5.92.12

### Patch Changes

- fix(streamedQuery): maintain error state on reset refetch with initialData defined ([#10287](https://github.com/TanStack/query/pull/10287))

- Updated dependencies [[`248975e`](https://github.com/TanStack/query/commit/248975e896f585f6eaa505c796e73fcf7bfd1eec)]:
  - @tanstack/query-core@5.91.2

## 5.92.11

### Patch Changes

- Updated dependencies [[`a89aab9`](https://github.com/TanStack/query/commit/a89aab975581c25c113a26c8af486b4cafad272a)]:
  - @tanstack/query-core@5.91.1

## 5.92.10

### Patch Changes

- fix(vue-query/useMutation): add missing '\_defaulted' omit in 'UseMutationOptionsBase' ([#10215](https://github.com/TanStack/query/pull/10215))

- Updated dependencies [[`6fa901b`](https://github.com/TanStack/query/commit/6fa901b97a22a80d0fca3f6ed86237ff0cbdd13b)]:
  - @tanstack/query-core@5.91.0

## 5.92.9

### Patch Changes

- Updated dependencies [[`e7258c5`](https://github.com/TanStack/query/commit/e7258c5cb30cafa456cdb4e6bc75b43bf619954d)]:
  - @tanstack/query-core@5.90.20

## 5.92.8

### Patch Changes

- Updated dependencies [[`53fc74e`](https://github.com/TanStack/query/commit/53fc74ebb16730bd3317f039a69c6821386bae93)]:
  - @tanstack/query-core@5.90.19

## 5.92.7

### Patch Changes

- Updated dependencies [[`dea1614`](https://github.com/TanStack/query/commit/dea1614aaad5c572cf43cea54b64ac09dc4d5b41)]:
  - @tanstack/query-core@5.90.18

## 5.92.6

### Patch Changes

- Updated dependencies [[`269351b`](https://github.com/TanStack/query/commit/269351b8ce4b4846da3d320ac5b850ee6aada0d6)]:
  - @tanstack/query-core@5.90.17

## 5.92.5

### Patch Changes

- Updated dependencies [[`7f47906`](https://github.com/TanStack/query/commit/7f47906eaccc3f3aa5ce24b77a83bd7a620a237b)]:
  - @tanstack/query-core@5.90.16

## 5.92.4

### Patch Changes

- Updated dependencies [[`fccef79`](https://github.com/TanStack/query/commit/fccef797d57d4a9566517bba87c8377f363920f2)]:
  - @tanstack/query-core@5.90.15

## 5.92.3

### Patch Changes

- Updated dependencies [[`d576092`](https://github.com/TanStack/query/commit/d576092e2ece4ca3936add3eb0da5234c1d82ed4)]:
  - @tanstack/query-core@5.90.14

## 5.92.2

### Patch Changes

- Updated dependencies [[`4a0a78a`](https://github.com/TanStack/query/commit/4a0a78afbc2432f8cb6828035965853fa98c86a0)]:
  - @tanstack/query-core@5.90.13

## 5.92.1

### Patch Changes

- Updated dependencies [[`72d8ac5`](https://github.com/TanStack/query/commit/72d8ac5c592004b8f9c3ee086fcb9c3cd615ca05)]:
  - @tanstack/query-core@5.90.12

## 5.92.0

### Minor Changes

- feat(vue-query): allow options getters in additional composables ([#9914](https://github.com/TanStack/query/pull/9914))

## 5.91.4

### Patch Changes

- Updated dependencies [[`c01b150`](https://github.com/TanStack/query/commit/c01b150e3673e11d6533768529a5e6fe3ebee68c)]:
  - @tanstack/query-core@5.90.11

## 5.91.3

### Patch Changes

- Include TPageParam in enabled of InfiniteQueryObserverOptions ([#9898](https://github.com/TanStack/query/pull/9898))

## 5.91.2

### Patch Changes

- Updated dependencies [[`8e2e174`](https://github.com/TanStack/query/commit/8e2e174e9fd2e7b94cd232041e49c9d014d74e26), [`eb559a6`](https://github.com/TanStack/query/commit/eb559a66dc0d77dd46435f624fa64fc068bef9ae)]:
  - @tanstack/query-core@5.90.10

## 5.91.1

### Patch Changes

- Updated dependencies [[`08b211f`](https://github.com/TanStack/query/commit/08b211f8aa475e05d2f13a36517fc556861ef962)]:
  - @tanstack/query-core@5.90.9

## 5.91.0

### Minor Changes

- feat(vue-query): support useQuery options getter ([#9866](https://github.com/TanStack/query/pull/9866))

## 5.90.8

### Patch Changes

- Updated dependencies [[`c0ec9fe`](https://github.com/TanStack/query/commit/c0ec9fe0d1426fe3f233adda3ebf23989ffaa110)]:
  - @tanstack/query-core@5.90.8

## 5.90.7

### Patch Changes

- Updated dependencies [[`b4cd121`](https://github.com/TanStack/query/commit/b4cd121a39d07cefaa3a3411136d342cc54ce8fb)]:
  - @tanstack/query-core@5.90.7

## 5.90.6

### Patch Changes

- Updated dependencies [[`1638c02`](https://github.com/TanStack/query/commit/1638c028df55648995d04431179904371a189772)]:
  - @tanstack/query-core@5.90.6

## 5.90.5

### Patch Changes

- Updated dependencies [[`e42ddfe`](https://github.com/TanStack/query/commit/e42ddfe919f34f847ca101aeef162c69845f9a1e)]:
  - @tanstack/query-core@5.90.5

## 5.90.4

### Patch Changes

- Updated dependencies [[`20ef922`](https://github.com/TanStack/query/commit/20ef922a0a7c3aee00150bf69123c338b0922922)]:
  - @tanstack/query-core@5.90.4

## 5.90.3

### Patch Changes

- Updated dependencies [[`4e1c433`](https://github.com/TanStack/query/commit/4e1c4338a72f7384600bbda99e44bc1891695df4)]:
  - @tanstack/query-core@5.90.3
