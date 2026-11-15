import { LitElement, html } from 'lit'
import {
  createQueryController,
  noop,
  useQueryClient,
} from '@tanstack/lit-query'
import { charactersQueries } from './services/characters/queries'

class CharacterItem extends LitElement {
  static properties = {
    characterId: { attribute: false },
    name: { attribute: false },
  }

  characterId = 0
  name = ''

  private readonly character = createQueryController(this, () => ({
    ...charactersQueries.detail(this.characterId),
    enabled: false,
  }))

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private prefetch() {
    useQueryClient()
      .query({
        ...charactersQueries.detail(this.characterId),
        staleTime: 10 * 1000, // only prefetch if older than 10 seconds
      })
      .catch(noop)
  }

  private selectCharacter() {
    this.dispatchEvent(
      new CustomEvent('select-character', { detail: this.characterId }),
    )
  }

  render() {
    const { data } = this.character()

    return html`
      <li @mouseenter=${this.prefetch} @focusin=${this.prefetch}>
        <button
          type="button"
          style=${data ? 'font-weight: bold' : ''}
          @click=${this.selectCharacter}
        >
          ${this.characterId} - ${this.name}
        </button>
        <a href="/character/${this.characterId}">details</a>
      </li>
    `
  }
}

customElements.define('character-item', CharacterItem)
