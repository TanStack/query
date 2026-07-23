# @tanstack/query-devtools

## 5.101.4

## 5.101.3

## 5.101.2

### Patch Changes

- [#10813](https://github.com/TanStack/query/pull/10813) [`f5bf180`](https://github.com/TanStack/query/commit/f5bf180d933d8b8d9d9e7b845e55b26a3a413b07) - fix(query-devtools/PiPContext): reset 'pip_open' in 'localStore' from 'closePipWindow' so the auto-open createEffect does not reopen the window after a programmatic close

- [#10812](https://github.com/TanStack/query/pull/10812) [`25cdd97`](https://github.com/TanStack/query/commit/25cdd975fed4703d2ca5b600ca5ccd2b600b3dd8) - fix(query-devtools/utils): make 'last updated' sort return 0 for queries with equal 'dataUpdatedAt' to follow the standard comparator contract

- [#10815](https://github.com/TanStack/query/pull/10815) [`ecd89c8`](https://github.com/TanStack/query/commit/ecd89c8faf7acc226f00633ea3a761d3ab842c1d) - fix(query-devtools/utils): scope the 'setupStyleSheet' dedup check to the target so a 'shadowDOMTarget' still receives its own '#\_goober' style tag when 'document.head' already has one

- [#10811](https://github.com/TanStack/query/pull/10811) [`01c7634`](https://github.com/TanStack/query/commit/01c763444e3cf3dfa9744f13911aa1533cac3c29) - fix(query-devtools/Devtools): correct the Theme sub-trigger className from 'position' to 'theme'

- [#10736](https://github.com/TanStack/query/pull/10736) [`49012db`](https://github.com/TanStack/query/commit/49012dbd5192dfe483d3b108b72ffaa7f2849e0f) - `setupStyleSheet` now sets `window.__nonce__` when a `styleNonce` is provided.

  The devtools use [goober](https://goober.js.org/) for CSS-in-JS, which reads `window.__nonce__` every time it creates or accesses its style element. Without this, goober overwrote the nonce with `undefined`, causing CSP violations even when `styleNonce` was correctly passed to `<ReactQueryDevtools>`.

## 5.101.1

## 5.101.0

### Patch Changes

- [#10772](https://github.com/TanStack/query/pull/10772) [`3042860`](https://github.com/TanStack/query/commit/3042860e3c8731c94ca4dec0e277e415d0484fce) - Avoid crashing devtools query rows when a cached query state is temporarily unavailable.

- [#10750](https://github.com/TanStack/query/pull/10750) [`e631dc3`](https://github.com/TanStack/query/commit/e631dc3fa17bff71f413246b7a770a730016d346) - Resolve devtools query rows from their stable query hash so mutated object query keys do not break row rendering.

## 5.100.14

## 5.100.13

## 5.100.12

## 5.100.11

## 5.100.10

### Patch Changes

- fix(query-devtools): remove experimentalDts to prevent solid-js type leak ([#10694](https://github.com/TanStack/query/pull/10694))

## 5.100.9

### Patch Changes

- Update the devtools panel `setOnClose` callback type to return `void`. ([#10607](https://github.com/TanStack/query/pull/10607))

## 5.100.8

## 5.100.7

## 5.100.6

## 5.100.5

## 5.100.4

### Patch Changes

- fix(devtools): change onClose callback type from () => unknown to () => void ([#10118](https://github.com/TanStack/query/pull/10118))

## 5.100.3

## 5.100.2

## 5.100.1

## 5.100.0

## 5.99.2

## 5.99.1

## 5.99.0

## 5.98.0

## 5.97.0

## 5.96.2

## 5.96.1

## 5.96.0

## 5.95.2

## 5.95.1

## 5.95.0

## 5.94.5

### Patch Changes

- fix(\*): resolve issue about excluded build directory ([#10312](https://github.com/TanStack/query/pull/10312))

## 5.94.4

### Patch Changes

- chore: fixed version ([#10064](https://github.com/TanStack/query/pull/10064))

## 5.93.0

### Minor Changes

- Set data to undefined on Trigger Error ([#10072](https://github.com/TanStack/query/pull/10072))

## 5.92.0

### Minor Changes

- improve a11y around screenreader + resizing ([#9961](https://github.com/TanStack/query/pull/9961))

### Patch Changes

- fix(devtools): handle PiP open failures by resetting persisted state ([#9983](https://github.com/TanStack/query/pull/9983))

## 5.91.1

### Patch Changes

- improves accessibility of devtools ([#9806](https://github.com/TanStack/query/pull/9806))

## 5.91.0

### Minor Changes

- feat(devtools): allow passing a theme via prop ([#9887](https://github.com/TanStack/query/pull/9887))
