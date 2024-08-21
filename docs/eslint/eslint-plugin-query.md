---
id: eslint-plugin-query
title: ESLint Plugin Query
---

TanStack Query comes with its own ESLint plugin. This plugin is used to enforce best practices and to help you avoid common mistakes.

## Installation

The plugin is a separate package that you need to install:

```bash
$ npm i -D @tanstack/eslint-plugin-query@4
# or
$ pnpm add -D @tanstack/eslint-plugin-query@4
# or
$ yarn add -D @tanstack/eslint-plugin-query@4
```

## Usage

Add `@tanstack/eslint-plugin-query` to the plugins section of your `.eslintrc` configuration file:

```json
{
  "plugins": ["@tanstack/query"]
}
```

Then configure the rules you want to use under the rules section:

```json
{
  "rules": {
    "@tanstack/query/exhaustive-deps": "error",
    "@tanstack/query/no-deprecated-options": "error",
    "@tanstack/query/prefer-query-object-syntax": "error",
    "@tanstack/query/stable-query-client": "error"
  }
}
```

### Recommended config

You can also enable all the recommended rules for our plugin. Add `plugin:@tanstack/eslint-plugin-query/recommended` in extends:

```json
{
  "extends": ["plugin:@tanstack/eslint-plugin-query/recommended"]
}
```
