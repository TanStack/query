# Example: filter devtools queries and mutations by data

Repro for filtering the devtools query and mutation lists by data with many large payloads.
It creates 300 product detail queries, 150 user queries, 150 order queries and 150 return mutations.
Each value listed on the page exists in the data of a single query or mutation only.
The bar at the top is animated with `requestAnimationFrame` and freezes while the main thread is blocked.

To run this example:

- `pnpm install`
- `pnpm --filter @tanstack/react-query-devtools... build`
- `pnpm dev`

Change the number of queries and mutations with `?products=600&users=300&orders=300&returns=300`.
