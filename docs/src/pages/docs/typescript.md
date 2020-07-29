---
id: typescript
title: TypeScript
---

React Query is now written in **TypeScript** to make sure the library and your projects are type-safe!

## Migration

React Query is currently typed with an external type definition file, which unfortunately often gets out of sync with the actual code.

This is one of the reasons why the library has been migrated to TypeScript.

But before exposing the new types, we first want to get your feedback on it!

Install the `tsnext` tag to get the latest React Query with the new types:

```sh
npm install react-query@tsnext --save
```

## Changes

- The query results are no longer discriminated unions, which means you have to check the actual `data` and `error` properties.
