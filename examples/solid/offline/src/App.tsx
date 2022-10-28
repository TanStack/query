/* @refresh reload */

import {
  createQuery,
  QueryClient,
  //QueryClientProvider,
  MutationCache,
  onlineManager,
  useIsRestoring,
  //useQueryClient,
} from '@tanstack/solid-query'

import {
  PersistQueryClientProvider,
} from '@tanstack/solid-query-persist-client'

import { createIndexedDBPersister } from './persister'

import { Component, createSignal, For, Match, Setter, Switch } from 'solid-js'

// TODO @tanstack/solid-query-devtools
//import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

//import toast, { Toaster } from "react-hot-toast";
import toast, { Toaster } from 'solid-toast';

/*
import {
  Link,
  Outlet,
  ReactLocation,
  Router,
  useMatch,
} from "@tanstack/react-location";
*/

// TODO: A vs Navigate?
// https://github.com/solidjs/solid-router#the-navigate-component
// Solid Router provides a Navigate component that works similarly to A,
// but it will *immediately* navigate to the provided path
// as soon as the component is rendered

import { Routes, Route, A as Link } from "@solidjs/router";

import * as api from "./api";
import { movieKeys, useMovie } from "./movies";

/* TODO?

import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
const persister = createAsyncStoragePersister()

*/

const persister = createIndexedDBPersister()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 2000,
      retry: 0,
      refetchOnWindowFocus: false,
    },
  },
  // configure global cache callbacks to show toast notifications
  mutationCache: new MutationCache({
    onSuccess: (data: any) => {
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  }),
});

// we need a default mutation function so that paused mutations can resume after a page reload
queryClient.setMutationDefaults(movieKeys.all(), {
  mutationFn: async ({ id, comment }) => {
    // to avoid clashes with our optimistic update when an offline mutation continues
    await queryClient.cancelQueries(movieKeys.detail(id));
    return api.updateMovie(id, comment);
  },
});

export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        // resume mutations after initial restore from localStorage was successful
        queryClient.resumePausedMutations().then(() => {
          queryClient.invalidateQueries();
        });
      }}
    >
      <Movies />
      {
        //<ReactQueryDevtools initialIsOpen />
      }
    </PersistQueryClientProvider>
  );
}

function Movies() {
  const isRestoring = useIsRestoring();
  return (
    <>
      <Routes>
        <Route
          path="/"
          component={List}
        />
        <Route
          path="/:movieId"
          component={Detail}
          // TODO
          //errorComponent={MovieError}
          //data={({ params: { movieId } }: { params: { movieId: string } }) =>
          data={({ params: { movieId } }: { params: any }) =>
              queryClient.getQueryData(movieKeys.detail(movieId)) ??
              // do not load if we are offline or hydrating because it returns a promise that is pending until we go online again
              // we just let the Detail component handle it
              (onlineManager.isOnline() && !isRestoring
                ? queryClient.fetchQuery(movieKeys.detail(movieId), () =>
                    api.fetchMovie(movieId)
                  )
                : undefined)}
        />
        <Route
          path="/about"
          element={<div>This site was made with Solid</div>}
        />
      </Routes>
      {
        //<Outlet />
      }
      <Toaster />
    </>
  );
}

function List() {
  const moviesQuery = createQuery(
    () => movieKeys.list(),
    api.fetchMovies
  );

  if (moviesQuery.isLoading && moviesQuery.isFetching) {
    return "Loading...";
  }

  if (moviesQuery.data) {
    return (
      <div>
        <h1>Movies</h1>
        <p>
          Try to mock offline behaviour with the button in the devtools. You can
          navigate around as long as there is already data in the cache. You'll
          get a refetch as soon as you go online again.
        </p>
        <ul>
          {moviesQuery.data.movies.map((movie) => (
            <li id={movie.id}>
              {
                //<Link href={`./${movie.id}`} preload>
              }
              <Link href={`./${movie.id}`}>
                {movie.title}
              </Link>
            </li>
          ))}
        </ul>
        <div>
          Updated at: {new Date(moviesQuery.data.ts).toLocaleTimeString()}
        </div>
        <div>{moviesQuery.isFetching && "fetching..."}</div>
      </div>
    );
  }

  // query will be in 'idle' fetchStatus while restoring from localStorage
  return null;
}

/* TODO
function MovieError() {
  const { error } = useMatch();

  return (
    <div>
      <Link href="..">Back</Link>
      <h1>Couldn't load movie!</h1>
      <div>{error.message}</div>
    </div>
  );
}
*/

function Detail(props: any) {
  const { comment, setComment, updateMovie, movieQuery } = useMovie(props.movieId);

  if (movieQuery.isLoading && movieQuery.isFetching) {
    return "Loading...";
  }

  function submitForm(event: any) {
    event.preventDefault();

    updateMovie.mutate({
      id: props.movieId,
      comment,
    } as any);
  }

  if (movieQuery.data) {
    return (
      <form onSubmit={submitForm}>
        <Link href="..">Back</Link>
        <h1>Movie: {movieQuery.data.movie.title}</h1>
        <p>
          Try to mock offline behaviour with the button in the devtools, then
          update the comment. The optimistic update will succeed, but the actual
          mutation will be paused and resumed once you go online again.
        </p>
        <p>
          You can also reload the page, which will make the persisted mutation
          resume, as you will be online again when you "come back".
        </p>
        <p>
          <label>
            Comment: <br />
            <textarea
              name="comment"
              value={comment as any}
              onChange={(event: any) => setComment(event.target.value)}
            />
          </label>
        </p>
        <button type="submit">Submit</button>
        <div>
          Updated at: {new Date(movieQuery.data.ts).toLocaleTimeString()}
        </div>
        <div>{movieQuery.isFetching && "fetching..."}</div>
        <div>
          {updateMovie.isPaused
            ? "mutation paused - offline"
            : updateMovie.isLoading && "updating..."}
        </div>
      </form>
    );
  }

  if (movieQuery.isPaused) {
    return "We're offline and have no data to show :(";
  }

  return null;
}
