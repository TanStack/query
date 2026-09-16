---
id: QueryFeature
title: QueryFeature
---

An opaque configuration returned by Query feature functions. Pass these values to
`provideTanStackQuery`; application code does not construct or inspect them.

```ts
provideTanStackQuery(
  () => new QueryClient(),
  withHydrationKey('secondary-cache'),
)
```

See [provideTanStackQuery](../functions/provideTanStackQuery.md) for provider setup
and [SSR](../../guides/ssr.md) for hydration features.
