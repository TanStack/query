# @tanstack/eslint-plugin-query

## 5.100.6

## 5.100.5

## 5.100.4

## 5.100.3

## 5.100.2

## 5.100.1

## 5.100.0

## 5.99.2

## 5.99.1

### Patch Changes

- fix(eslint-plugin-query): fix `no-void-query-fn` false positive on enum returns for typescript 6. ([#10460](https://github.com/TanStack/query/pull/10460))

## 5.99.0

## 5.98.0

## 5.97.0

### Minor Changes

- feat(eslint): support eslint v10 and typescript v6 ([#10182](https://github.com/TanStack/query/pull/10182))

## 5.96.2

### Patch Changes

- fix(eslint-plugin): normalize whitespace in allowList variable matching for multiline expressions ([#10337](https://github.com/TanStack/query/pull/10337))

## 5.96.1

## 5.96.0

### Minor Changes

- Add `prefer-query-options` rule and `recommendedStrict` config ([#10359](https://github.com/TanStack/query/pull/10359))

## 5.95.2

## 5.95.1

## 5.95.0

### Minor Changes

- BREAKING (eslint-plugin): The `exhaustive-deps` rule now reports member expression dependencies more granularly for call expressions (e.g. `a.b.foo()` suggests `a.b`), which may cause existing code that previously passed the rule to now report missing dependencies. To accommodate stable variables and types, the rule now accepts an `allowlist` option with `variables` and `types` arrays to exclude specific dependencies from enforcement. ([#10295](https://github.com/TanStack/query/pull/10295))

## 5.94.5

### Patch Changes

- fix(\*): resolve issue about excluded build directory ([#10312](https://github.com/TanStack/query/pull/10312))

## 5.94.4

### Patch Changes

- chore: fixed version ([#10064](https://github.com/TanStack/query/pull/10064))

## 5.91.5

### Patch Changes

- Fix `exhaustive-deps` to detect dependencies used inside nested `queryFn` callbacks/control flow, and avoid false positives when those dependencies are already present in complex `queryKey` expressions. ([#10258](https://github.com/TanStack/query/pull/10258))

## 5.91.4

### Patch Changes

- fix(eslint-plugin-query): declare typescript as optional peer dependency ([#10007](https://github.com/TanStack/query/pull/10007))

## 5.91.3

### Patch Changes

- exhaustive-deps rule fixed for vue files ([#10011](https://github.com/TanStack/query/pull/10011))

## 5.91.2

### Patch Changes

- fix: allow useQueries with combine property in no-unstable-deps rule ([#9720](https://github.com/TanStack/query/pull/9720))

## 5.91.1

### Patch Changes

- avoid typescript import in no-void-query-fn rule ([#9759](https://github.com/TanStack/query/pull/9759))

## 5.91.0

### Minor Changes

- feat: improve type of exported plugin ([#9700](https://github.com/TanStack/query/pull/9700))

## 5.90.2

### Patch Changes

- fix: exhaustive-deps with variables and type assertions ([#9687](https://github.com/TanStack/query/pull/9687))
