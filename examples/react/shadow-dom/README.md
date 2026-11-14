# TanStack React Query Shadow DOM Example

Renders the app and the devtools inside a shadow root.

## How it works

- `src/services/dogs/queries.ts` defines `dogsQueries.list()` with `queryOptions`, and `src/services/dogs/api.ts` fetches the breed list from the Dog CEO API.
- `src/DogList.tsx` reads it with `useQuery(dogsQueries.list())` and lists the breed names.
- `src/main.tsx` attaches an open shadow root to `#root`, renders the app into it with `QueryClientProvider`, and passes the same root to `ReactQueryDevtools` as `shadowDOMTarget` so the devtools styles are injected inside the shadow root.

To run this example:

- `npm install`
- `npm run dev`
