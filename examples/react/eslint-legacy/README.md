# TanStack React Query Basic Example (ESLint Legacy Config)

The basic posts example, linted with the legacy `.eslintrc` config of `@tanstack/eslint-plugin-query`.

## How it works

- `src/index.tsx` declares the queries inline: `Posts` calls `useQuery` with `queryKey: ['posts']`, and `Post` calls it with `queryKey: ['post', postId]` and `enabled: !!postId`.
- In `src/index.tsx`, the list marks a post as visited when `queryClient.getQueryData(['post', post.id])` returns cached data.
- `src/index.tsx` wraps the app in `PersistQueryClientProvider` with a `createAsyncStoragePersister` over `window.localStorage`, and its `QueryClient` sets `gcTime` to 24 hours.
- `.eslintrc` extends `plugin:@tanstack/query/recommended`, and the `test:eslint` script in `package.json` runs ESLint with `ESLINT_USE_FLAT_CONFIG=false` so the legacy config is used.

To run this example:

- `npm install`
- `npm run dev`
