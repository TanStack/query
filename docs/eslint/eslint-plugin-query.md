---
id: eslint-plugin-query
title: ESLint Plugin Query
---

TanStack Query comes with its own ESLint plugin. This plugin is used to enforce best practices and to help you avoid common mistakes.

## Installation

The plugin is a separate package that you need to install:

```bash
npm i -D @tanstack/eslint-plugin-query
```

or

```bash
pnpm add -D @tanstack/eslint-plugin-query
```

or

```bash
yarn add -D @tanstack/eslint-plugin-query
```

or

```bash
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

## Rules

- [@tanstack/query/exhaustive-deps](./exhaustive-deps.md)
- [@tanstack/query/no-rest-destructuring](./no-rest-destructuring.md)
- [@tanstack/query/stable-query-client](./stable-query-client.md)
- [@tanstack/query/no-unstable-deps](./no-unstable-deps.md)
- [@tanstack/query/infinite-query-property-order](./infinite-query-property-order.md)
