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

import { Routes, Route, A as Link, useParams } from "@solidjs/router";

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
      refetchOnMount: false,
      refetchOnReconnect: false,
      //retryOnMount: false,
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
      onSuccess={async () => {
        // resume mutations after initial restore from localStorage was successful
        await queryClient.resumePausedMutations();
        // no. this would refetch queries
        //await queryClient.invalidateQueries();
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
    <div>
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
          //data={({ props: { movieId } }: { props: { movieId: string } }) =>
          //data={fetchMovie}
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
    </div>
  );
}

function List() {
  console.log('List: createQuery', movieKeys.list(), api.fetchMovies)
  const moviesQuery = createQuery(
    () => movieKeys.list(),
    api.fetchMovies
  );

  return (
    <div>
      <h1>Movies</h1>
      <div>
        <Switch>
          <Match when={moviesQuery.status === 'loading'}>Loading...</Match>
          <Match when={moviesQuery.isPaused}>We're offline and have no data to show :(</Match>
          <Match when={moviesQuery.error instanceof Error}>
            <span>Error: {(moviesQuery.error as Error).message}</span>
          </Match>
          <Match when={moviesQuery.data !== undefined}>
            <>
              {/* TODO solid devtools
              <p>
                Try to mock offline behaviour with the button in the devtools. You can
                navigate around as long as there is already data in the cache. You'll
                get a refetch as soon as you go online again.
              </p>
              */}
              <ul>
                <For each={moviesQuery.data?.movies}>
                  {(movie) => (
                    <li
                      id={movie.id}
                      style={
                        // We can access the query data here to show bold links for
                        // ones that are cached
                        queryClient.getQueryData(['post', movie.id])
                          ? {
                              'font-weight': 'bold',
                              color: 'green',
                            }
                          : {}
                      }
                    >
                      {
                        // TODO preload
                        //<Link href={`./${movie.id}`} preload>
                      }
                      <Link href={`./${movie.id}`}>
                        {movie.title}
                      </Link>
                    </li>
                  )}
                </For>
              </ul>
              <div>
                Updated at: {new Date(moviesQuery.data?.ts || 0).toLocaleTimeString()}
              </div>
              <div>{moviesQuery.isFetching ? 'fetching...' : ' '}</div>
            </>
          </Match>
          {
            // query will be in 'idle' fetchStatus while restoring from localStorage
          }
          <Match when={true}>restoring...</Match>
        </Switch>
      </div>
    </div>
  )
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

function Detail() {

  const props = useParams();

  /*
  const fetchMovie = ({ props: { movieId } }: { props: any }) => {
    console.log(`fetchMovie: arguments`, arguments)
    return queryClient.getQueryData(movieKeys.detail(movieId)) ??
    // do not load if we are offline or hydrating because it returns a promise that is pending until we go online again
    // we just let the Detail component handle it
    (onlineManager.isOnline() && !isRestoring
      ? queryClient.fetchQuery(movieKeys.detail(movieId), () =>
          api.fetchMovie(movieId)
        )
      : undefined)
  }
  */

  const { comment, setComment, updateMovie, movieQuery } = useMovie(props.movieId);

  function submitForm(event: any) {
    event.preventDefault();

    updateMovie.mutate({
      id: props.movieId,
      comment: comment(),
    } as any);
  }

  return (
    <div>
      <Switch>
        <Match when={!props.movieId}>
          No movieId
        </Match>
        <Match when={movieQuery.status === 'loading'}>
          Loading...
        </Match>
        <Match when={movieQuery.isPaused}>
          We're offline and have no data to show :(
        </Match>
        <Match when={movieQuery.error instanceof Error}>
          <span>Error: {(movieQuery.error as Error).message}</span>
        </Match>
        <Match when={movieQuery.data !== undefined}>
          <form onSubmit={submitForm}>
            <Link href="..">Back</Link>
            <h1>Movie: {movieQuery.data?.movie.title}</h1>
            {/*
            <p>
              Try to mock offline behaviour with the button in the devtools, then
              update the comment. The optimistic update will succeed, but the actual
              mutation will be paused and resumed once you go online again.
            </p>
            */}
            <p>
              You can also reload the page, which will make the persisted mutation
              resume, as you will be online again when you "come back".
            </p>
            <p>
              <label>
                Comment:<br/>
                <textarea
                  name="comment"
                  value={comment()} // FIXME undefined after mutate, because reactivity is lost in persister
                  //value={comment() || ''}
                  //value={movieQuery.data?.movie.comment}
                  onChange={(event: any) => setComment(event.target.value)}
                />
              </label>
            </p>
            <button type="submit">Submit</button>
            <div>
              Updated at: {new Date(movieQuery.data?.ts || 0).toLocaleTimeString()}
            </div>
            <div>{movieQuery.isFetching && "fetching..."}</div>
            <div>
              {updateMovie.isPaused
                ? "mutation paused - offline"
                : updateMovie.isLoading && "updating..."}
            </div>
          </form>
        </Match>
        {
          // query will be in 'idle' fetchStatus while restoring from localStorage
        }
        <Match when={true}>restoring...</Match>
      </Switch>
    </div>
  )
}
