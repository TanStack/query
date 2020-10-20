---
id: typescript
title: TypeScript
---

React Query is now written in **TypeScript** to make sure the library and your projects are type-safe!

Install the latest version to get React Query with the new types:

```sh
npm install react-query --save
```

## Changes

- The query results are no longer discriminated unions, which means you have to check the actual `data` and `error` properties.
- Requires TypeScript v3.8 or greater

## Defining Custom Hooks

When defining a custom hook you need to specify the result and error types, for example:

    export function useGroups() {
      return useQuery<Group[], Error>(
        'list-groups',
        () => fetch(`/api/groups`).then(res => res.json())
      )
    }
