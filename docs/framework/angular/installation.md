---
id: installation
title: Installation
---

_Angular Query is compatible with Angular v20.1 and higher._

### Angular CLI

```sh
ng add @tanstack/angular-query
```

This installs the package and devtools, then configures an SSR-safe `QueryClient` factory with
`withDevtools()`.

### Package managers

```sh
npm i @tanstack/angular-query
```

or

```sh
pnpm add @tanstack/angular-query
```

or

```sh
yarn add @tanstack/angular-query
```

or

```sh
bun add @tanstack/angular-query
```

If you want Angular Query devtools, install the standalone devtools package as well:

```sh
npm i @tanstack/angular-query-devtools
```

> Want to try it first? See the [simple](./examples/simple) or [basic](./examples/basic) example.
