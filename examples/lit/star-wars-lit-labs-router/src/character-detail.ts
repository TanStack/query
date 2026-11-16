import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { charactersQueries } from './services/characters/queries'
import './character-film'
import './character-homeworld'

const getId = (url: string) => {
  const urlParts = url.split('/').filter(Boolean)
  return urlParts[urlParts.length - 1]
}

class CharacterDetail extends LitElement {
  static properties = {
    characterId: { attribute: false },
  }

  characterId = ''

  private readonly character = createQueryController(this, () =>
    charactersQueries.detail(this.characterId),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const { data, status } = this.character()

    if (status === 'pending') return html`<p>Loading...</p>`
    if (status === 'error') return html`<p>Error :(</p>`

    return html`
      <div>
        <h2 class="text-4xl">${data.name}</h2>
        <p><strong>Born</strong>: ${data.birth_year}</p>
        <p><strong>Eyes</strong>: ${data.eye_color}</p>
        <p><strong>Hair</strong>: ${data.hair_color}</p>
        <p><strong>Height</strong>: ${data.height}</p>
        <p><strong>Mass</strong>: ${data.mass}</p>
        <p>
          <strong>Homeworld</strong>:
          <character-homeworld
            .homeworldId=${getId(data.homeworld)}
          ></character-homeworld>
        </p>

        <h4 class="text-2xl pt-4">Films</h4>
        ${data.films.map(
          (film) =>
            html`<character-film .filmId=${getId(film)}></character-film>`,
        )}
      </div>
    `
  }
}

customElements.define('character-detail', CharacterDetail)
