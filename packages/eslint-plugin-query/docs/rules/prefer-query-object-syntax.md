# Prefer object syntax for useQuery (`@tanstack/query/prefer-query-object-syntax`)

You can use [`useQuery`](https://tanstack.com/query/v4/docs/reference/useQuery) in two different ways.

Standard

```ts
useQuery(queryKey, queryFn?, options?)

// or

useQuery(options)
```

This rule prefers the second option, as it is more consistent with other React Query hooks, like `useQueries`. It will also be the only available option in a future major version.

## Rule Details

Examples of **incorrect** code for this rule:

```js
import { useQuery } from '@tanstack/react-query';

useQuery(queryKey, queryFn, {
  onSuccess,
});

useQuery(queryKey, {
  queryFn,
  onSuccess,
});
```

Examples of **correct** code for this rule:

```js
import { useQuery } from '@tanstack/react-query';

useQuery({
  queryKey,
  queryFn,
  onSuccess,
});
```

## When Not To Use It

If you don't care about useQuery consistency, then you will not need this rule.

## Attributes

- [x] ✅ Recommended
- [x] 🔧 Fixable
