import { LitElement, html } from 'lit'
import { createQueriesController } from '@tanstack/lit-query'
import { charactersQueries } from './services/characters/queries'

class CharacterList extends LitElement {
  static properties = {
    ids: { attribute: false },
  }

  ids: Array<number> = []

  private readonly characters = createQueriesController(this, () => ({
    queries: this.ids.map((id) => charactersQueries.detail(id)),
  }))

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return this.characters().map((character) => {
      if (character.status === 'pending') {
        return 'Loading...'
      }
      if (character.status === 'error') {
        return 'Error...'
      }
      if (character.data === null) {
        return 'Not found ...'
      }

      return html`
        <div style="display: flex">
          <img
            width="100"
            height="100"
            alt=${character.data.image}
            src=${character.data.image}
          />
          <div style="padding-left: 10px; text-align: left">
            <h5 style="margin-top: 0; margin-bottom: 5px">
              ${character.data.name} (#${character.data.id})
            </h5>
            <p style="margin-top: 0; margin-bottom: 2px">
              Status: ${character.data.status}
            </p>
            <p style="margin-top: 0; margin-bottom: 2px">
              Species: ${character.data.species}
            </p>
            <p style="margin-top: 0; margin-bottom: 2px">
              Gender: ${character.data.gender}
            </p>
          </div>
        </div>
      `
    })
  }
}

customElements.define('character-list', CharacterList)
