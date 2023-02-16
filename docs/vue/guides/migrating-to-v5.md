---
id: migrating-to-tanstack-query-5
title: Migrating to TanStack Query v5
ref: docs/react/guides/migrating-to-v5.md
---

[//]: # 'FrameworkBreakingChanges'

## Vue Query Breaking Changes

### `useQueries` composable returns `ref` instead of `reactive`

To fix compatibility with Vue 2, `useQueries` hook returns now `queries` array wrapped in `ref`.
Previously `reactive` was returned which led to multiple problems:

- User could spread return value loosing reactivity.
- `readonly` wrapper used for return value was breaking Vue 2 reactivity detection mechanism. This was a silent issue in Vue 2.6, but appeared as error in Vue 2.7.
- Vue 2 does not support arrays as a root value of `reactive`.

With this change all of those issues are fixed.

Also this aligns `useQueries` with other composables which return all of the values as `refs`.

[//]: # 'FrameworkBreakingChanges'
