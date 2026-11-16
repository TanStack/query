# TanStack Svelte Query Shadow DOM Example

Renders the app and the devtools inside a shadow root.

## How it works

- `src/lib/services/dogs/queries.ts` defines `dogsQueries.list()` with `queryOptions`, keyed by `['dogs', 'list']`, and `src/lib/services/dogs/api.ts` fetches the breed list from the Dog CEO API.
- `src/lib/DogList.svelte` reads the breeds with `createQuery` and renders one row per breed.
- `src/main.ts` attaches a shadow root to `#app`, mounts `src/App.svelte` into it and passes the shadow root as a prop. `src/App.svelte` hands it to `SvelteQueryDevtools` as `shadowDOMTarget`, so the devtools styles are injected inside the shadow root.

To run this example:

- `npm install`
- `npm run dev`
