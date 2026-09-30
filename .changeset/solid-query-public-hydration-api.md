---
'@tanstack/solid-query': patch
'@tanstack/solid-query-devtools': patch
---

Move off Solid's internal `sharedConfig` onto its public hydration API. The hydrating-mount checks read `isHydrating()`, the server cache stream writes through `getHydrationWriter()` gated on `isHydratable()` (so `<NoHydration>` is still respected), and `useQuery` consumes its streamed entry with `takeHydrationValue()`. `sharedConfig` is internal in Solid 2.0 and absent from the published `solid-js` declarations, so the previous imports no longer type-check.
