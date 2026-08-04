---
"@tanstack/query-devtools": patch
---

perf(devtools): stop rebuilding list rows on every update

The virtualized query and mutation lists rebuilt every mounted row's component
on each scroll and each cache event. The window is recomputed into freshly
allocated row wrappers, so the keyed list's item signal always notified, and
because the row was rendered by calling the row renderer inside a child
position that read that signal, each notification tore down and reconstructed
the row - its DOM, its styles and its cache subscriptions. Rows now receive an
accessor and read the item through a prop, so a row is built once and updated
in place, matching how the lists behaved before they were virtualized.
