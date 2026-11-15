import { LitElement, html, nothing } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { charactersQueries } from './services/characters/queries'

class FilmCharacter extends LitElement {
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

    if (status !== 'success') return nothing

    return html`
      <a
        class="text-blue-500 hover:underline"
        href="/characters/${this.characterId}"
      >
        <h6 class="text-lg">${data.name}</h6>
      </a>
    `
  }
}

customElements.define('film-character', FilmCharacter)
