# Read-only imports across framework adapters

Each TypeScript entry exports the public client and ordinary query reader for its framework. The React and Preact entries include the required options factory. Vite bundles each entry independently with its framework external. The Svelte entry uses the Svelte compiler plugin.

The check inspects retained modules in the emitted production ESM. It first requires the query client, cache, and observer, then checks which optional core modules the reader can omit. The React application fixtures separately measure transferred bytes and exercise complete routes in Chromium.

From the repository root, run `pnpm nx run @tanstack/query-integration-treeshaking:test:build`.
