import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/solid-query'
import { Link, createFileRoute } from '@tanstack/solid-router'
import { Match, Show, Switch, createSignal } from 'solid-js'
import { moviesMutations, moviesQueries } from '../services/movies/queries'

export const Route = createFileRoute('/$movieId')({
  loader: ({ context: { queryClient, isRestoring }, params: { movieId } }) =>
    queryClient.getQueryData(moviesQueries.detail(movieId).queryKey) ??
    // do not load if we are offline or hydrating because it returns a promise that is pending until we go online again
    // we just let the Detail component handle it
    (onlineManager.isOnline() && !isRestoring()
      ? queryClient.query(moviesQueries.detail(movieId))
      : undefined),
  component: Detail,
})

function Detail() {
  const params = Route.useParams()
  const queryClient = useQueryClient()
  const movieQuery = useQuery(() => moviesQueries.detail(params().movieId))

  const [commentDraft, setCommentDraft] = createSignal<string | undefined>()

  const updateMovie = useMutation(() => ({
    ...moviesMutations.update(),
    mutationKey: moviesQueries.detail(params().movieId).queryKey,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: moviesQueries.detail(params().movieId).queryKey,
      })
      const { queryKey } = moviesQueries.detail(params().movieId)
      const previousData = queryClient.getQueryData(queryKey)

      // remove local state so that server state is taken instead
      setCommentDraft(undefined)

      queryClient.setQueryData(
        queryKey,
        (old) =>
          old && {
            ...old,
            movie: {
              ...old.movie,
              comment: variables.comment,
            },
          },
      )

      return { previousData }
    },
    onError: (_, __, onMutateResult) => {
      queryClient.setQueryData(
        moviesQueries.detail(params().movieId).queryKey,
        onMutateResult?.previousData,
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: moviesQueries.detail(params().movieId).queryKey,
      })
    },
  }))

  const comment = () => commentDraft() ?? movieQuery.data?.movie.comment

  function submitForm(event: SubmitEvent) {
    event.preventDefault()

    const currentComment = comment()
    if (currentComment === undefined) {
      return
    }

    updateMovie.mutate({
      id: params().movieId,
      comment: currentComment,
    })
  }

  return (
    <Switch>
      <Match when={movieQuery.isLoading}>Loading...</Match>
      <Match when={movieQuery.data}>
        <form onSubmit={submitForm}>
          <Link to="/">Back</Link>
          <h1>Movie: {movieQuery.data!.movie.title}</h1>
          <p>
            Try to mock offline behavior with the button in the devtools, then
            update the comment. The optimistic update will succeed, but the
            actual mutation will be paused and resumed once you go online again.
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
                value={comment() ?? ''}
                onInput={(event) => setCommentDraft(event.currentTarget.value)}
              />
            </label>
          </p>
          <button type="submit">Submit</button>
          <div>
            Updated at: {new Date(movieQuery.data!.ts).toLocaleTimeString()}
          </div>
          <Show when={movieQuery.isFetching}>
            <div>fetching...</div>
          </Show>
          <div>
            {updateMovie.isPaused
              ? 'mutation paused - offline'
              : updateMovie.isPending && 'updating...'}
          </div>
        </form>
      </Match>
      <Match when={movieQuery.isError}>
        <div>
          <Link to="/">Back</Link>
          <h1>Couldn't load movie!</h1>
          <div>{movieQuery.error?.message}</div>
        </div>
      </Match>
      <Match when={movieQuery.isPaused}>
        We're offline and have no data to show :(
      </Match>
    </Switch>
  )
}
