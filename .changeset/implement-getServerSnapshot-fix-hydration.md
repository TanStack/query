---
'@tanstack/react-query': minor
'@tanstack/preact-query': minor
---

Implement `getServerSnapshot` for `useSyncExternalStore` to fix hydration mismatches.

- Added `HydrationContext` with `HydrationSnapshotContext` for transporting server snapshots
- Updated `HydrationBoundary` to provide snapshot layers for nested boundaries
- Modified `useBaseQuery` in both React and Preact to use `getServerSnapshot` in `useSyncExternalStore`
- Fixes hydration mismatches when using prefetched data with `isLoading` checks (#9399)
- Fixes hydration mismatches when prefetched data resolves before client render (#9642)
- Supports nested `HydrationBoundary` components