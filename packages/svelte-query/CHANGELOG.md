# @tanstack/svelte-query

## 6.2.0

### Minor Changes

- [#11356](https://github.com/TanStack/query/pull/11356) [`f6ae1cc`](https://github.com/TanStack/query/commit/f6ae1ccdf74a61ea15e845d4643e6d4b0a0b7bdf) - feat(svelte-query): add 'DefinedInitialDataInfiniteOptions' overload for 'createInfiniteQuery'/'infiniteQueryOptions'

### Patch Changes

- Updated dependencies [[`fdae2ce`](https://github.com/TanStack/query/commit/fdae2ce4e5382af7326c7c38ce5d5a12751ada12)]:
  - @tanstack/query-core@5.102.9

## 6.1.48

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.102.8

## 6.1.47

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.102.7

## 6.1.46

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.102.6

## 6.1.45

### Patch Changes

- Updated dependencies [[`578e5c2`](https://github.com/TanStack/query/commit/578e5c26e8ebd0d7351b4b8e2bafba695e672b8d)]:
  - @tanstack/query-core@5.102.5

## 6.1.44

### Patch Changes

- Updated dependencies [[`a05df6a`](https://github.com/TanStack/query/commit/a05df6aefb0e2489ec2c879ae16e2ee7cb3123ec)]:
  - @tanstack/query-core@5.102.4

## 6.1.43

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.102.3

## 6.1.42

### Patch Changes

- [#10892](https://github.com/TanStack/query/pull/10892) [`cafd540`](https://github.com/TanStack/query/commit/cafd540c02f78be260198c4e84d054390c02c6b8) - Fix `createQueries` crashing with `TypeError: 'deleteProperty' on proxy: trap returned falsish for property 'N'` when two or more items were removed from its reactive array in the same update.

- [#11127](https://github.com/TanStack/query/pull/11127) [`320ed25`](https://github.com/TanStack/query/commit/320ed25caca4e219b53f778c59cbb380543a21f4) - Fix `createQueries` staying inactive when it is initialized with an empty `queries` array.

- [#11153](https://github.com/TanStack/query/pull/11153) [`250050d`](https://github.com/TanStack/query/commit/250050d863d33fbc881c6e342c104d510403a9e1) - fix(svelte-query): remove mutations that no longer match the filter in `useMutationState`

## 6.1.41

### Patch Changes

- Updated dependencies [[`80fbf73`](https://github.com/TanStack/query/commit/80fbf73e77892d702c107e14a84c219a8ed825dc)]:
  - @tanstack/query-core@5.102.2

## 6.1.40

### Patch Changes

- Updated dependencies [[`134890d`](https://github.com/TanStack/query/commit/134890dbdc60e4fb0313e44b512d29284ca82f96)]:
  - @tanstack/query-core@5.102.1

## 6.1.39

### Patch Changes

- [#10373](https://github.com/TanStack/query/pull/10373) [`6e3d521`](https://github.com/TanStack/query/commit/6e3d521fe54f78624e53c1c6f9cadd678504bee8) - fix(types): propagate generic type parameters to `useMutationState` select callback

- [#11224](https://github.com/TanStack/query/pull/11224) [`294d4e6`](https://github.com/TanStack/query/commit/294d4e62c4f7d674574a4903eef2a1bc3dd1413b) - Fix `queryOptions` and `infiniteQueryOptions` return types so exported inferred options can be emitted in declaration files without leaking internal data tag symbols.

- [#8737](https://github.com/TanStack/query/pull/8737) [`2215bb0`](https://github.com/TanStack/query/commit/2215bb031139cdc8a84751b37a485c38ca9d2b6e) - fix: make mutation variables optional when `undefined extends TVariables`

- [#11221](https://github.com/TanStack/query/pull/11221) [`1ef4208`](https://github.com/TanStack/query/commit/1ef42087c9a266c2137d2ef645cbcc662f60ac93) - Remove experimental render-time prefetching and the `promise` property from query results.

- Updated dependencies [[`34f7cee`](https://github.com/TanStack/query/commit/34f7ceed09c10e4a3aa2df31a106ddf02ec4e787), [`b4368c4`](https://github.com/TanStack/query/commit/b4368c43792349f6c29d1fb41f7ee1ef3a8bdd2c), [`5bb089d`](https://github.com/TanStack/query/commit/5bb089d153d33933983b7ea80f8d69b51d423698), [`ba4650c`](https://github.com/TanStack/query/commit/ba4650c05e61e33c609e051b948c9f7d31ce70d1), [`294d4e6`](https://github.com/TanStack/query/commit/294d4e62c4f7d674574a4903eef2a1bc3dd1413b), [`1f631b3`](https://github.com/TanStack/query/commit/1f631b3604aab6567fb3f6c90646a5a304641546), [`01a02bf`](https://github.com/TanStack/query/commit/01a02bfad32f9efbc17796be31d6399f1197a655), [`18c1c1e`](https://github.com/TanStack/query/commit/18c1c1ef94883e781ad36d36f9ea4a043ce4260b), [`5448063`](https://github.com/TanStack/query/commit/5448063f828d2270dccd41ae375e1afde35e91f2), [`2215bb0`](https://github.com/TanStack/query/commit/2215bb031139cdc8a84751b37a485c38ca9d2b6e), [`1ef4208`](https://github.com/TanStack/query/commit/1ef42087c9a266c2137d2ef645cbcc662f60ac93), [`5981771`](https://github.com/TanStack/query/commit/5981771abec9330b344a2617543eb05ba7c99e24), [`4a9bef6`](https://github.com/TanStack/query/commit/4a9bef6cf19b1cd6b014032d696129f12a848185), [`bef4bc7`](https://github.com/TanStack/query/commit/bef4bc780ce7cca32b7e3dea85f77d92f82a62a2), [`9656dc4`](https://github.com/TanStack/query/commit/9656dc4e5fef5f8c502579b52459f9e8c72e787c), [`326aaf1`](https://github.com/TanStack/query/commit/326aaf1333e5d9cbc46569c53f218d31684162d2), [`3e83601`](https://github.com/TanStack/query/commit/3e836010032c2586e9f1c66a271fa9114a6401f9), [`c6fc17c`](https://github.com/TanStack/query/commit/c6fc17cfad6e452261c585fabfb8c210e60531ed)]:
  - @tanstack/query-core@5.102.0

## 6.1.38

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.101.4

## 6.1.37

### Patch Changes

- Updated dependencies [[`7e3c822`](https://github.com/TanStack/query/commit/7e3c822a10896f41a8f1031c16b85096277af677)]:
  - @tanstack/query-core@5.101.3

## 6.1.36

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.101.2

## 6.1.35

### Patch Changes

- Updated dependencies [[`9eff92e`](https://github.com/TanStack/query/commit/9eff92ed86e284ec0125b3a3539d028688235bd1)]:
  - @tanstack/query-core@5.101.1

## 6.1.34

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.101.0

## 6.1.33

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.14

## 6.1.32

### Patch Changes

- Updated dependencies [[`d423168`](https://github.com/TanStack/query/commit/d423168f6261a5cb3d353e53b27c8150cc271151)]:
  - @tanstack/query-core@5.100.13

## 6.1.31

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.12

## 6.1.30

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.11

## 6.1.29

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.10

## 6.1.28

### Patch Changes

- Updated dependencies [[`fcee7bd`](https://github.com/TanStack/query/commit/fcee7bdc429385ae8ffa224fa8a7a9ec7b8ee380)]:
  - @tanstack/query-core@5.100.9

## 6.1.27

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.8

## 6.1.26

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.7

## 6.1.25

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.6

## 6.1.24

### Patch Changes

- Updated dependencies [[`a53ef97`](https://github.com/TanStack/query/commit/a53ef97f87decb8ea2431710f5199431d3c94c8d)]:
  - @tanstack/query-core@5.100.5

## 6.1.23

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.100.4

## 6.1.22

### Patch Changes

- Updated dependencies [[`f85d825`](https://github.com/TanStack/query/commit/f85d825e02efbbff02e2081528ed28f5e5382f7a)]:
  - @tanstack/query-core@5.100.3

## 6.1.21

### Patch Changes

- Updated dependencies [[`ea4497e`](https://github.com/TanStack/query/commit/ea4497e8aa00d8c1c3a36fb1e17563a889d6ab31), [`d6a7bf3`](https://github.com/TanStack/query/commit/d6a7bf3e3e024c1a77d0536813238cc8007a5fa7), [`645d5d1`](https://github.com/TanStack/query/commit/645d5d130f5e8017cb1bf1a37987f7b980aed705)]:
  - @tanstack/query-core@5.100.2

## 6.1.20

### Patch Changes

- Updated dependencies [[`1bb0d23`](https://github.com/TanStack/query/commit/1bb0d234280fd4ae1725c439088426a20593a8df)]:
  - @tanstack/query-core@5.100.1

## 6.1.19

### Patch Changes

- Updated dependencies [[`6540a41`](https://github.com/TanStack/query/commit/6540a4126b1c087d86d64525e78f32d9920dcd31)]:
  - @tanstack/query-core@5.100.0

## 6.1.18

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.99.2

## 6.1.17

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.99.1

## 6.1.16

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.99.0

## 6.1.15

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.98.0

## 6.1.14

### Patch Changes

- Updated dependencies [[`2bfb12c`](https://github.com/TanStack/query/commit/2bfb12cc44f1d8495106136e4ddacb817135f8f9)]:
  - @tanstack/query-core@5.97.0

## 6.1.13

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.96.2

## 6.1.12

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.96.1

## 6.1.11

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.96.0

## 6.1.10

### Patch Changes

- Updated dependencies [[`cd5a35b`](https://github.com/TanStack/query/commit/cd5a35b328837781aa4f9305bb2bd7877ca934e9)]:
  - @tanstack/query-core@5.95.2

## 6.1.9

### Patch Changes

- Updated dependencies [[`1f1775c`](https://github.com/TanStack/query/commit/1f1775ca92f2b6c035682947ff3b3424804ff31a)]:
  - @tanstack/query-core@5.95.1

## 6.1.8

### Patch Changes

- Updated dependencies []:
  - @tanstack/query-core@5.95.0

## 6.1.7

### Patch Changes

- fix(\*): resolve issue about excluded build directory ([#10312](https://github.com/TanStack/query/pull/10312))

- Updated dependencies [[`4b6536d`](https://github.com/TanStack/query/commit/4b6536dfce99036f4e37f52943c6fed3ad0e0a18)]:
  - @tanstack/query-core@5.94.5

## 6.1.6

### Patch Changes

- chore: fixed version ([#10064](https://github.com/TanStack/query/pull/10064))

- Updated dependencies [[`4c75210`](https://github.com/TanStack/query/commit/4c75210ce8235fe3d39b67e1029eff11278927cc)]:
  - @tanstack/query-core@5.94.4

## 6.1.3

### Patch Changes

- fix(streamedQuery): maintain error state on reset refetch with initialData defined ([#10287](https://github.com/TanStack/query/pull/10287))

- Updated dependencies [[`248975e`](https://github.com/TanStack/query/commit/248975e896f585f6eaa505c796e73fcf7bfd1eec)]:
  - @tanstack/query-core@5.91.2

## 6.1.2

### Patch Changes

- Updated dependencies [[`a89aab9`](https://github.com/TanStack/query/commit/a89aab975581c25c113a26c8af486b4cafad272a)]:
  - @tanstack/query-core@5.91.1

## 6.1.1

### Patch Changes

- Updated dependencies [[`6fa901b`](https://github.com/TanStack/query/commit/6fa901b97a22a80d0fca3f6ed86237ff0cbdd13b)]:
  - @tanstack/query-core@5.91.0

## 6.1.0

### Minor Changes

- feat(svelte-query): add 'mutationOptions' ([#10175](https://github.com/TanStack/query/pull/10175))

## 6.0.18

### Patch Changes

- Updated dependencies [[`e7258c5`](https://github.com/TanStack/query/commit/e7258c5cb30cafa456cdb4e6bc75b43bf619954d)]:
  - @tanstack/query-core@5.90.20

## 6.0.17

### Patch Changes

- Updated dependencies [[`53fc74e`](https://github.com/TanStack/query/commit/53fc74ebb16730bd3317f039a69c6821386bae93)]:
  - @tanstack/query-core@5.90.19

## 6.0.16

### Patch Changes

- Updated dependencies [[`dea1614`](https://github.com/TanStack/query/commit/dea1614aaad5c572cf43cea54b64ac09dc4d5b41)]:
  - @tanstack/query-core@5.90.18

## 6.0.15

### Patch Changes

- Updated dependencies [[`269351b`](https://github.com/TanStack/query/commit/269351b8ce4b4846da3d320ac5b850ee6aada0d6)]:
  - @tanstack/query-core@5.90.17

## 6.0.14

### Patch Changes

- Updated dependencies [[`7f47906`](https://github.com/TanStack/query/commit/7f47906eaccc3f3aa5ce24b77a83bd7a620a237b)]:
  - @tanstack/query-core@5.90.16

## 6.0.13

### Patch Changes

- Updated dependencies [[`fccef79`](https://github.com/TanStack/query/commit/fccef797d57d4a9566517bba87c8377f363920f2)]:
  - @tanstack/query-core@5.90.15

## 6.0.12

### Patch Changes

- Updated dependencies [[`d576092`](https://github.com/TanStack/query/commit/d576092e2ece4ca3936add3eb0da5234c1d82ed4)]:
  - @tanstack/query-core@5.90.14

## 6.0.11

### Patch Changes

- Updated dependencies [[`4a0a78a`](https://github.com/TanStack/query/commit/4a0a78afbc2432f8cb6828035965853fa98c86a0)]:
  - @tanstack/query-core@5.90.13

## 6.0.10

### Patch Changes

- Updated dependencies [[`72d8ac5`](https://github.com/TanStack/query/commit/72d8ac5c592004b8f9c3ee086fcb9c3cd615ca05)]:
  - @tanstack/query-core@5.90.12

## 6.0.9

### Patch Changes

- Updated dependencies [[`c01b150`](https://github.com/TanStack/query/commit/c01b150e3673e11d6533768529a5e6fe3ebee68c)]:
  - @tanstack/query-core@5.90.11

## 6.0.8

### Patch Changes

- Updated dependencies [[`8e2e174`](https://github.com/TanStack/query/commit/8e2e174e9fd2e7b94cd232041e49c9d014d74e26), [`eb559a6`](https://github.com/TanStack/query/commit/eb559a66dc0d77dd46435f624fa64fc068bef9ae)]:
  - @tanstack/query-core@5.90.10

## 6.0.7

### Patch Changes

- Updated dependencies [[`08b211f`](https://github.com/TanStack/query/commit/08b211f8aa475e05d2f13a36517fc556861ef962)]:
  - @tanstack/query-core@5.90.9

## 6.0.6

### Patch Changes

- Updated dependencies [[`c0ec9fe`](https://github.com/TanStack/query/commit/c0ec9fe0d1426fe3f233adda3ebf23989ffaa110)]:
  - @tanstack/query-core@5.90.8

## 6.0.5

### Patch Changes

- Updated dependencies [[`b4cd121`](https://github.com/TanStack/query/commit/b4cd121a39d07cefaa3a3411136d342cc54ce8fb)]:
  - @tanstack/query-core@5.90.7

## 6.0.4

### Patch Changes

- Updated dependencies [[`1638c02`](https://github.com/TanStack/query/commit/1638c028df55648995d04431179904371a189772)]:
  - @tanstack/query-core@5.90.6

## 6.0.3

### Patch Changes

- Updated dependencies [[`e42ddfe`](https://github.com/TanStack/query/commit/e42ddfe919f34f847ca101aeef162c69845f9a1e)]:
  - @tanstack/query-core@5.90.5

## 6.0.2

### Patch Changes

- Updated dependencies [[`20ef922`](https://github.com/TanStack/query/commit/20ef922a0a7c3aee00150bf69123c338b0922922)]:
  - @tanstack/query-core@5.90.4

## 6.0.1

### Patch Changes

- Updated dependencies [[`4e1c433`](https://github.com/TanStack/query/commit/4e1c4338a72f7384600bbda99e44bc1891695df4)]:
  - @tanstack/query-core@5.90.3

## 6.0.0

### Major Changes

- BREAKING: Migrate to svelte runes (signals). Requires [Svelte v5.25.0](https://github.com/sveltejs/svelte/releases/tag/svelte%405.25.0) or newer. Please see the [migration guide](https://tanstack.com/query/latest/docs/framework/svelte/migrate-from-v5-to-v6). ([#9694](https://github.com/TanStack/query/pull/9694))
