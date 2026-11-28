import {
  createQueryController,
  isError,
  isFetching,
  isLoading,
} from '@tanstack/lit-query'
import { LitElement, html } from 'lit'
import { moviesQueries } from './services/movies/queries'

class MovieListView extends LitElement {
  private readonly movies = createQueryController(this, moviesQueries.list())

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const queryResult = this.movies()

    if (isLoading(queryResult)) {
      return 'Loading...'
    }

    if (queryResult.data) {
      return html`
        <div>
          <h1>Movies</h1>
          <p>
            Try to mock offline behavior with the button above. You can navigate
            around as long as there is already data in the cache. You'll get a
            refetch as soon as you go online again.
          </p>
          <ul>
            ${queryResult.data.movies.map(
              (movie) =>
                html`<li><a href="/${movie.id}">${movie.title}</a></li>`,
            )}
          </ul>
          <div>
            Updated at: ${new Date(queryResult.data.ts).toLocaleTimeString()}
          </div>
          <div>${isFetching(queryResult) ? 'fetching...' : ''}</div>
        </div>
      `
    }

    if (isError(queryResult)) {
      return html`
        <div>
          <h1>Couldn't load movies!</h1>
          <div>${queryResult.error.message}</div>
        </div>
      `
    }

    return null
  }
}

customElements.define('movie-list-view', MovieListView)
