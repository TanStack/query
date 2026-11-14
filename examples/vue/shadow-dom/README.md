# TanStack Vue Query Shadow DOM Example

Renders the app and the devtools inside a shadow root.

## How it works

- `src/services/dogs/queries.ts` defines `dogsQueries.list()`, a `queryOptions` factory keyed by `['dogs', 'list']` that fetches all breeds from the Dog API.
- `src/DogList.vue` reads it with `useQuery(dogsQueries.list())` and lists the breed names.
- `src/main.ts` attaches an open shadow root to `#app`, installs `VueQueryPlugin`, mounts the app into a container inside that shadow root, and passes the root as the `shadowRoot` prop.
- `src/App.vue` passes that root to `VueQueryDevtools` as `shadow-d-o-m-target`, with the toggle button at the bottom left.

To run this example:

- `npm install`
- `npm run dev`
