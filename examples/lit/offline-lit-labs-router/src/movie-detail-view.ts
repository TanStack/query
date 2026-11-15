import { LitElement, html } from 'lit'
import {
  createMutationController,
  createQueryController,
} from '@tanstack/lit-query'
import { moviesMutations, moviesQueries } from './services/movies/queries'

class MovieDetailView extends LitElement {
  static properties = {
    movieId: { attribute: false },
    commentDraft: { state: true },
  }

  movieId = ''
  private commentDraft: string | undefined

  private readonly movie = createQueryController(this, () =>
    moviesQueries.detail(this.movieId),
  )

  private readonly updateMovie = createMutationController(this, () => ({
    ...moviesMutations.update(),
    mutationKey: moviesQueries.detail(this.movieId).queryKey,
    onMutate: async (variables, { client }) => {
      await client.cancelQueries({
        queryKey: moviesQueries.detail(this.movieId).queryKey,
      })
      const { queryKey } = moviesQueries.detail(this.movieId)
      const previousData = client.getQueryData(queryKey)

      // remove local state so that server state is taken instead
      this.commentDraft = undefined

      client.setQueryData(
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
    onError: (_, __, onMutateResult, { client }) => {
      client.setQueryData(
        moviesQueries.detail(this.movieId).queryKey,
        onMutateResult?.previousData,
      )
    },
    onSettled: (_, __, ___, ____, { client }) => {
      client.invalidateQueries({
        queryKey: moviesQueries.detail(this.movieId).queryKey,
      })
    },
  }))

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private get comment() {
    return this.commentDraft ?? this.movie().data?.movie.comment
  }

  private submitForm(event: SubmitEvent) {
    event.preventDefault()

    const comment = this.comment

    if (comment === undefined) {
      return
    }

    this.updateMovie.mutate({
      id: this.movieId,
      comment,
    })
  }

  render() {
    const { data, error, isError, isFetching, isLoading, isPaused } =
      this.movie()
    const { isPaused: isMutationPaused, isPending: isMutationPending } =
      this.updateMovie()

    if (isLoading) {
      return 'Loading...'
    }

    if (data) {
      return html`
        <form @submit=${this.submitForm}>
          <a href="/">Back</a>
          <h1>Movie: ${data.movie.title}</h1>
          <p>
            Try to mock offline behavior with the button above, then update the
            comment. The optimistic update will succeed, but the actual mutation
            will be paused and resumed once you go online again.
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
                .value=${this.comment ?? ''}
                @input=${(event: Event) =>
                  (this.commentDraft = (
                    event.currentTarget as HTMLTextAreaElement
                  ).value)}
              ></textarea>
            </label>
          </p>
          <button type="submit">Submit</button>
          <div>Updated at: ${new Date(data.ts).toLocaleTimeString()}</div>
          <div>${isFetching ? 'fetching...' : ''}</div>
          <div>
            ${
              isMutationPaused
                ? 'mutation paused - offline'
                : isMutationPending
                  ? 'updating...'
                  : ''
            }
          </div>
        </form>
      `
    }

    if (isError) {
      return html`
        <div>
          <a href="/">Back</a>
          <h1>Couldn't load movie!</h1>
          <div>${error.message}</div>
        </div>
      `
    }

    if (isPaused) {
      return "We're offline and have no data to show :("
    }

    return null
  }
}

customElements.define('movie-detail-view', MovieDetailView)
