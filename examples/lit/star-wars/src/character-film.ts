import { LitElement, html, nothing } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { filmsQueries } from './services/films/queries'

class CharacterFilm extends LitElement {
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

    if (status !== 'success') return nothing

    return html`
      <a class="text-blue-500 hover:underline" href="/films/${this.filmId}">
        <h6 class="text-lg">${data.episode_id}. ${data.title}</h6>
      </a>
    `
  }
}

customElements.define('character-film', CharacterFilm)
