# TanStack React Query Prefetching Example (Next.js App Router)

Prefetches a Pokémon in a Server Component and hydrates it in a Client Component with `HydrationBoundary`.

Built with [Next.js (App Router)](https://nextjs.org/docs/app).

## How it works

- `services/pokemons/queries.ts` defines `pokemonsQueries.detail(id)` with `queryOptions`, and `services/pokemons/api.ts` fetches the Pokémon from PokéAPI.
- `app/get-query-client.ts` creates a new `QueryClient` per request on the server and reuses one in the browser. Its `dehydrate` defaults include pending queries through `shouldDehydrateQuery` and turn off `shouldRedactErrors`.
- `app/page.tsx` is a Server Component that starts `queryClient.query(pokemonsQueries.detail(25))` without awaiting it and passes `dehydrate(queryClient)` to `HydrationBoundary`, so the pending query is sent to the client.
- `app/pokemon-info.tsx` is a Client Component that reads the same options with `useSuspenseQuery` and picks up the data streamed from the server instead of fetching again.

To run this example:

- `npm install`
- `npm run dev`
