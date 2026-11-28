import { createQueryController, isFetching } from '@tanstack/lit-query'
import { LitElement, html } from 'lit'
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
    const queryResult = this.character()

    if (!this.isValidId) return 'Invalid character ID'
    if (queryResult.status === 'pending') return 'Loading...'
    if (queryResult.status === 'error')
      return html`<span>Error: ${queryResult.error.message}</span>`

    return html`
      <h1>${queryResult.data.name}</h1>
      <div>
        <p>status: ${queryResult.data.status}</p>
        <p>species: ${queryResult.data.species}</p>
        <p>gender: ${queryResult.data.gender}</p>
        <p>origin: ${queryResult.data.origin.name}</p>
      </div>
      <div>${isFetching(queryResult) ? 'Background Updating...' : ' '}</div>
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
