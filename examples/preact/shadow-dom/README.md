# TanStack Preact Query Shadow DOM Example

Renders the app and the devtools inside a shadow root.

## How it works

- `src/services/dogs/queries.ts` defines `dogsQueries.list()`, a `queryOptions` factory keyed by `['dogs', 'list']` that fetches the breed list from the Dog CEO API.
- `src/DogList.tsx` passes it to `useQuery` and lists the breed names.
- `src/index.tsx` creates a shadow root with `attachShadow`, renders `QueryClientProvider` into it, and passes the shadow root to `PreactQueryDevtools` as `shadowDOMTarget` so the devtools styles are added inside it.

To run this example:

- `npm install`
- `npm run dev`
