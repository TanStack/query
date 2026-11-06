# Example: filter devtools queries by data

Repro for filtering the devtools query list by query data with many large payloads.
It creates 300 product detail queries, 150 user queries and 150 order queries.
Each value listed on the page exists in the data of a single query only.
The bar at the top is animated with `requestAnimationFrame` and freezes while the main thread is blocked.

To run this example:

- `pnpm install`
- `pnpm --filter @tanstack/react-query-devtools... build`
- `pnpm dev`

Change the number of queries with `?products=600&users=300&orders=300`.
