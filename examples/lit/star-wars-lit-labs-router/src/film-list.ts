import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { filmsQueries } from './services/films/queries'

const getFilmId = (url: string) => {
  const filmUrlParts = url.split('/').filter(Boolean)
  return filmUrlParts[filmUrlParts.length - 1]
}

class FilmList extends LitElement {
  private readonly films = createQueryController(this, filmsQueries.list())

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const { data, status } = this.films()

    if (status === 'pending') return html`<p>Loading...</p>`
    if (status === 'error') return html`<p>Error :(</p>`

    return html`
      <div>
        <h2 class="text-4xl">Films</h2>
        ${data.results.map(
          (film) => html`
            <article>
              <a
                class="text-blue-500 hover:underline"
                href="/films/${getFilmId(film.url)}"
              >
                <h6 class="text-xl">
                  ${film.episode_id}. ${film.title}
                  <em>
                    (${new Date(Date.parse(film.release_date)).getFullYear()})
                  </em>
                </h6>
              </a>
            </article>
          `,
        )}
      </div>
    `
  }
}

customElements.define('film-list', FilmList)
