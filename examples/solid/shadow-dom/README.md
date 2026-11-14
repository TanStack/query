# TanStack Solid Query Shadow DOM Example

Renders the app and the devtools inside a shadow root.

## How it works

- `src/services/dogs/queries.ts` defines `dogsQueries.list()` with `queryOptions`, keyed by `['dogs', 'list']`, and `src/services/dogs/api.ts` fetches the breed list from the Dog CEO API.
- `src/DogList.tsx` reads the breeds with `useQuery` and renders one row per breed.
- `src/index.tsx` attaches a shadow root to `#root` and renders the app into it. It passes the same shadow root to `SolidQueryDevtools` as `shadowDOMTarget`, so the devtools styles are injected inside the shadow root.

To run this example:

- `npm install`
- `npm run dev`
