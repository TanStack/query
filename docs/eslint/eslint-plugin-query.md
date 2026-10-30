---
id: eslint-plugin-query
title: ESLint Plugin Query
---

TanStack Query comes with its own ESLint plugin. This plugin is used to enforce best practices and to help you avoid common mistakes.

## Installation

The plugin is a separate package that you need to install:

```sh
npm i -D @tanstack/eslint-plugin-query
```

or

```sh
pnpm add -D @tanstack/eslint-plugin-query
```

or

```sh
yarn add -D @tanstack/eslint-plugin-query
```

or

```sh
bun add -D @tanstack/eslint-plugin-query
```

## Flat Config (`eslint.config.js`)

### Recommended setup

To enable all of the recommended rules for our plugin, add the following config:

```js
import pluginQuery from '@tanstack/eslint-plugin-query'

export default [
  ...pluginQuery.configs['flat/recommended'],
  // Any other config...
]
```

### Recommended strict setup

The `flat/recommended-strict` config extends `flat/recommended` with additional opinionated rules that enforce best practices more aggressively.

```js
import pluginQuery from '@tanstack/eslint-plugin-query'

export default [
  ...pluginQuery.configs['flat/recommended-strict'],
  // Any other config...
]
```

### Custom setup

Alternatively, you can load the plugin and configure only the rules you want to use:

```js
import pluginQuery from '@tanstack/eslint-plugin-query'

export default [
  {
    plugins: {
      '@tanstack/query': pluginQuery,
    },
    rules: {
      '@tanstack/query/exhaustive-deps': 'error',
    },
  },
  // Any other config...
]
```

## Legacy Config (`.eslintrc`)

### Recommended setup

To enable all of the recommended rules for our plugin, add `plugin:@tanstack/query/recommended` in extends:

```json
{
  "extends": ["plugin:@tanstack/query/recommended"]
}
```

### Recommended strict setup

The `recommendedStrict` config extends `recommended` with additional opinionated rules:

```json
{
  "extends": ["plugin:@tanstack/query/recommendedStrict"]
}
```

### Custom setup

Alternatively, add `@tanstack/query` to the plugins section, and configure the rules you want to use:

```json
{
  "plugins": ["@tanstack/query"],
  "rules": {
    "@tanstack/query/exhaustive-deps": "error"
  }
}
```

## Oxlint

The plugin can also be used with [Oxlint](https://oxc.rs/docs/guide/usage/linter) through its [JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins) support, which is currently in alpha. Rule names are the same as in ESLint.

### `oxlint.config.ts`

#### Recommended setup

To enable all of the recommended rules for our plugin, add the plugin to `jsPlugins` and spread the rules of the `recommended` config:

```ts
import { defineConfig } from 'oxlint'
import pluginQuery from '@tanstack/eslint-plugin-query'

export default defineConfig({
  jsPlugins: ['@tanstack/eslint-plugin-query'],
  rules: {
    ...pluginQuery.configs.recommended.rules,
  },
})
```

Use `pluginQuery.configs.recommendedStrict.rules` instead for the recommended strict setup.

#### Custom setup

Alternatively, configure only the rules you want to use:

```ts
import { defineConfig } from 'oxlint'

export default defineConfig({
  jsPlugins: ['@tanstack/eslint-plugin-query'],
  rules: {
    '@tanstack/query/exhaustive-deps': 'error',
  },
})
```

### `.oxlintrc.json`

A JSON config cannot import the configs of our plugin, so add the plugin to `jsPlugins` and configure the rules you want to use:

```json
{
  "jsPlugins": ["@tanstack/eslint-plugin-query"],
  "rules": {
    "@tanstack/query/exhaustive-deps": "error"
  }
}
```

> [!NOTE]
> [`no-void-query-fn`](./no-void-query-fn.md) needs type information, which Oxlint does not provide to JS plugins yet, so the rule does not report anything under Oxlint.

## Rules

- [@tanstack/query/exhaustive-deps](./exhaustive-deps.md)
- [@tanstack/query/no-rest-destructuring](./no-rest-destructuring.md)
- [@tanstack/query/stable-query-client](./stable-query-client.md)
- [@tanstack/query/no-unstable-deps](./no-unstable-deps.md)
- [@tanstack/query/infinite-query-property-order](./infinite-query-property-order.md)
- [@tanstack/query/no-void-query-fn](./no-void-query-fn.md)
- [@tanstack/query/mutation-property-order](./mutation-property-order.md)
- [@tanstack/query/prefer-query-options](./prefer-query-options.md)

## Other plugins

- [@tanstack/eslint-plugin-query-prefetch](./require-prefetch.md): requires routes to prefetch the queries they render
