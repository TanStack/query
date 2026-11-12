---
id: installation
title: Installation
---

> IMPORTANT: The `@tanstack/marko-query` package is currently experimental. Expect the API and docs to keep evolving. If you use it in production while it is early, pin the package to an exact version and upgrade deliberately.

You can install Marko Query via [NPM](https://npmjs.com).

### NPM

```sh
npm i @tanstack/marko-query
```

or

```sh
pnpm add @tanstack/marko-query
```

or

```sh
yarn add @tanstack/marko-query
```

or

```sh
bun add @tanstack/marko-query
```

Marko Query requires Marko 6 or higher.

### Requirements

The package ships its tags as `.marko` files, and your app compiles them. So your app needs a Marko build setup, for example [Marko Run](https://github.com/marko-js/run) or [`@marko/vite`](https://github.com/marko-js/vite). You do not have to configure the tags: the Marko compiler finds them through the `marko.json` file of the package.

Marko Query is optimized for modern browsers. It is compatible with the following browsers config

```txt
Chrome >= 91
Firefox >= 90
Edge >= 91
Safari >= 15
iOS >= 15
Opera >= 77
```

> Depending on your environment, you might need to add polyfills. To support older browsers, transpile the library from `node_modules`.

### Devtools

The devtools are a separate package. See [Devtools](./devtools.md).
