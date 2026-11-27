# @tanstack/angular-query-devtools

## 5.108.5

### Patch Changes

- Updated dependencies [[`18b1ade`](https://github.com/TanStack/query/commit/18b1aded329058c074cda6b1c1a08aba73fdc914)]:
  - @tanstack/query-devtools@5.108.5
  - @tanstack/angular-query@5.108.5

## 5.108.4

### Patch Changes

- Updated dependencies []:
  - @tanstack/angular-query@5.108.4
  - @tanstack/query-devtools@5.108.4

## 5.108.3

### Patch Changes

- Updated dependencies []:
  - @tanstack/angular-query@5.108.3
  - @tanstack/query-devtools@5.108.3

## 5.108.2

### Patch Changes

- [#12628](https://github.com/TanStack/query/pull/12628) [`80d6c41`](https://github.com/TanStack/query/commit/80d6c41fb8ee27db069874d1be75646bf48a64b0) - The devtools no longer use goober. Their styles are a static stylesheet adopted into the document or shadow root the devtools render in, instead of a `<style>` element in `<head>`. This means:

  - The devtools are styled on pages with a Content Security Policy that blocks inline `<style>` elements. `styleNonce` is no longer needed and is deprecated.
  - Devtools rendered inside a shadow root are styled without passing `shadowDOMTarget`.
  - With `shadowDOMTarget`, the settings menu is styled.
  - The picture-in-picture window gets all styles, including ones the devtools use only after it opened.
  - The devtools no longer write to the shared `#_goober` style element or set `window.__nonce__`.
  - Browsers without adoptable stylesheets (before Safari 16.4 and Firefox 101) show the devtools unstyled.

- [#12643](https://github.com/TanStack/query/pull/12643) [`fd62c95`](https://github.com/TanStack/query/commit/fd62c9583ec0e1fe65ae56542876f47184534930) - Add a `trustedTypesPolicy` option, so the devtools render on pages that enforce `require-trusted-types-for 'script'`.
- Updated dependencies [[`f7abc93`](https://github.com/TanStack/query/commit/f7abc938a8a7fe801d78f4cfdb98d65422f276b2), [`80d6c41`](https://github.com/TanStack/query/commit/80d6c41fb8ee27db069874d1be75646bf48a64b0), [`fd62c95`](https://github.com/TanStack/query/commit/fd62c9583ec0e1fe65ae56542876f47184534930)]:
  - @tanstack/query-devtools@5.108.2
  - @tanstack/angular-query@5.108.2

## 5.108.1

### Patch Changes

- Updated dependencies []:
  - @tanstack/angular-query@5.108.1
  - @tanstack/query-devtools@5.108.1

## 5.108.0

### Minor Changes

- [#12610](https://github.com/TanStack/query/pull/12610) [`5fc9a3e`](https://github.com/TanStack/query/commit/5fc9a3e9a8768eb3bc23da4ae903c966423a2286) - Release the Angular adapter packages in the same fixed version group as `@tanstack/query-core`, so they share the core version from now on.

### Patch Changes

- Updated dependencies [[`5fc9a3e`](https://github.com/TanStack/query/commit/5fc9a3e9a8768eb3bc23da4ae903c966423a2286)]:
  - @tanstack/angular-query@5.108.0
  - @tanstack/query-devtools@5.108.0

## 5.0.0

### Major Changes

- [#12534](https://github.com/TanStack/query/pull/12534) [`d687805`](https://github.com/TanStack/query/commit/d68780535edd1f4837e66ee42260889b762dfab1) - Add the stable Angular Query adapter for Angular 20.1+. It includes SSR support, experimental Resource API interoperability, persistence integration, improved internal subscription and pending tasks management, stable `injectQueries` and consistency improvements in the API.

### Patch Changes

- Updated dependencies [[`d687805`](https://github.com/TanStack/query/commit/d68780535edd1f4837e66ee42260889b762dfab1), [`d687805`](https://github.com/TanStack/query/commit/d68780535edd1f4837e66ee42260889b762dfab1)]:
  - @tanstack/angular-query@5.0.0

## 5.0.0-rc.5

### Patch Changes

- [#12054](https://github.com/TanStack/query/pull/12054) [`9464a5e`](https://github.com/TanStack/query/commit/9464a5e71f68c95cc12a07068ae30a2f1b13b0ea) - Update the Angular packages to the latest Query core and incorporate upstream adapter fixes, type coverage, and tooling updates.

- [#12054](https://github.com/TanStack/query/pull/12054) [`9464a5e`](https://github.com/TanStack/query/commit/9464a5e71f68c95cc12a07068ae30a2f1b13b0ea) - Build the Angular packages with Vite 8 while preserving their module entry points and external dependencies.
- Updated dependencies [[`9464a5e`](https://github.com/TanStack/query/commit/9464a5e71f68c95cc12a07068ae30a2f1b13b0ea)]:
  - @tanstack/angular-query@5.0.0-rc.5

## 5.0.0-rc.4

### Patch Changes

- Updated dependencies [[`46da583`](https://github.com/TanStack/query/commit/46da583fa3760715d9fb13677bbe022f901e0730), [`1a2f6b3`](https://github.com/TanStack/query/commit/1a2f6b38d534245b957c7ea87ac830cc1e06d7f1)]:
  - @tanstack/angular-query@5.0.0-rc.4

## 5.0.0-rc.3

### Patch Changes

- Updated dependencies [[`d83eef6`](https://github.com/TanStack/query/commit/d83eef68ae3484ec8254a9c28582ed41af30035b)]:
  - @tanstack/angular-query@5.0.0-rc.3

## 5.0.0-rc.2

### Patch Changes

- [#11999](https://github.com/TanStack/query/pull/11999) [`9e9dfb7`](https://github.com/TanStack/query/commit/9e9dfb7e752334c90378546635e87b03852e39bc) - Clear removed panel close callbacks and release devtools ownership when the injector is destroyed.

- Updated dependencies []:
  - @tanstack/angular-query@5.0.0-rc.2

## 5.0.0-rc.1

### Patch Changes

- [#11786](https://github.com/TanStack/query/pull/11786) [`afdf617`](https://github.com/TanStack/query/commit/afdf6173ea7d5e3e89827e3b6209036447303eb1) - Support the theme option in injectDevtoolsPanel

- Updated dependencies []:
  - @tanstack/angular-query@5.0.0-rc.1

## 5.0.0-rc.0

### Major Changes

- [#11516](https://github.com/TanStack/query/pull/11516) [`7da5a24`](https://github.com/TanStack/query/commit/7da5a24becd506c0d121c4c1d264251e62e53d96) - Add the stable Angular Query adapter for Angular 20.1+. It includes SSR support, Resource API interoperability, persistence integration, improved internal subscription and pending tasks management, stable `injectQueries` and consistency improvements in the API.

### Patch Changes

- Updated dependencies [[`7da5a24`](https://github.com/TanStack/query/commit/7da5a24becd506c0d121c4c1d264251e62e53d96)]:
  - @tanstack/angular-query@5.0.0-rc.0
