---
'@tanstack/query-devtools': patch
---

Compile the devtools stylesheet once per theme instead of once per component instance

`stylesFactory` builds around sixty CSS-in-JS templates, and twelve components
called it from inside their own per-instance memo. Two of those components are
the query and mutation rows, so the whole stylesheet was recompiled for every
row the virtualized list mounted, and again for every row it recycled while the
cache was changing.

The compiled result depends only on the theme and the `css` instance, so it is
now memoized on both. Memoizing on the `css` instance only works if that
instance is stable, and it was not: every call site built its own with
`css.bind({ target })`, which returns a new function each time. The bound
function is now cached per shadow root as well.
