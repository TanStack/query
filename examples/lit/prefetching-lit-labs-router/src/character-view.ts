import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { charactersQueries } from './services/characters/queries'

class CharacterView extends LitElement {
  static properties = {
    characterId: { attribute: false },
  }

  characterId = ''

  private readonly character = createQueryController(this, () =>
    charactersQueries.detail(
      this.isValidId ? Number(this.characterId) : undefined,
    ),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private get isValidId() {
    return /^\d+$/.test(this.characterId) && Number(this.characterId) > 0
  }

  private renderCharacter() {
    const { status, data, error, isFetching } = this.character()

    if (!this.isValidId) return 'Invalid character ID'
    if (status === 'pending') return 'Loading...'
    if (status === 'error') return html`<span>Error: ${error.message}</span>`

    return html`
      <h1>${data.name}</h1>
      <div>
        <p>status: ${data.status}</p>
        <p>species: ${data.species}</p>
        <p>gender: ${data.gender}</p>
        <p>origin: ${data.origin.name}</p>
      </div>
      <div>${isFetching ? 'Background Updating...' : ' '}</div>
    `
  }

  render() {
    return html`
      <div style="text-align: center">
        ${this.renderCharacter()}
        <br />
        <br />
        <a href="/">Back</a>
      </div>
    `
  }
}

customElements.define('character-view', CharacterView)
