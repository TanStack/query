import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { filmsQueries } from './services/films/queries'
import './film-character'

const getCharacterId = (url: string) => {
  const characterUrlParts = url.split('/').filter(Boolean)
  return characterUrlParts[characterUrlParts.length - 1]
}

class FilmDetail extends LitElement {
  static properties = {
    filmId: { attribute: false },
  }

  filmId = ''

  private readonly film = createQueryController(this, () =>
    filmsQueries.detail(this.filmId),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const { data, status } = this.film()

    if (status === 'pending') return html`<p>Loading...</p>`
    if (status === 'error') return html`<p>Error :(</p>`

    return html`
      <div>
        <h2 class="text-4xl">${data.title}</h2>
        <p>${data.opening_crawl}</p>
        <br />
        <h4 class="text-2xl">Characters</h4>
        ${data.characters.map(
          (character) =>
            html`<film-character
              .characterId=${getCharacterId(character)}
            ></film-character>`,
        )}
      </div>
    `
  }
}

customElements.define('film-detail', FilmDetail)
