import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { moviesQueries } from './services/movies/queries'

class MovieListView extends LitElement {
  private readonly movies = createQueryController(this, moviesQueries.list())

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const { data, error, isError, isFetching, isLoading } = this.movies()

    if (isLoading) {
      return 'Loading...'
    }

    if (data) {
      return html`
        <div>
          <h1>Movies</h1>
          <p>
            Try to mock offline behavior with the button above. You can navigate
            around as long as there is already data in the cache. You'll get a
            refetch as soon as you go online again.
          </p>
          <ul>
            ${data.movies.map(
              (movie) =>
                html`<li><a href="/${movie.id}">${movie.title}</a></li>`,
            )}
          </ul>
          <div>Updated at: ${new Date(data.ts).toLocaleTimeString()}</div>
          <div>${isFetching ? 'fetching...' : ''}</div>
        </div>
      `
    }

    if (isError) {
      return html`
        <div>
          <h1>Couldn't load movies!</h1>
          <div>${error.message}</div>
        </div>
      `
    }

    return null
  }
}

customElements.define('movie-list-view', MovieListView)
