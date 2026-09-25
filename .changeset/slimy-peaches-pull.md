---
---

fix(solid-query/examples): guard the `prefetchQuery` call in the solid-start-streaming example's `/prefetch` route with `isServer || intent !== 'initial'`, so it only runs on the server and on real client-side preload/navigation, not on every client hydration, fixing the duplicate fetch reported in #8840
