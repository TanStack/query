# TanStack React Query React Native Example

A movies app for React Native (Expo). Queries refetch when the app comes to the foreground and when the network reconnects, through `focusManager` and `onlineManager`, and support pull to refresh.

Built with [Expo](https://expo.dev).

## How it works

- `src/services/movies/queries.ts` defines `moviesQueries.list()` and `moviesQueries.detail(title)` with `queryOptions`. `src/services/movies/api.ts` reads `src/data/movies.json` after a random delay of up to about 2 seconds.
- `App.tsx` calls `focusManager.setFocused` from the `AppState` listener in `src/hooks/useAppState.ts`, and `src/hooks/useOnlineManager.ts` feeds NetInfo's connection state into `onlineManager.setEventListener`. Both are skipped on web, where the browser events already cover this.
- `src/screens/MoviesListScreen.tsx` reads `useQuery(moviesQueries.list())`, supports pull to refresh through `src/hooks/useRefreshByUser.ts`, and uses `src/hooks/useRefreshOnFocus.ts` to call `queryClient.refetchQueries({ stale: true, type: 'active' })` when the screen regains navigation focus.
- `src/screens/MovieDetailsScreen.tsx` reads the detail query with a `placeholderData` function that takes the matching movie from the cached list via `queryClient.getQueryData(moviesQueries.list().queryKey)`, so the title and year show while the full details load.

To run this example:

- `npm install`
- `npm start`
