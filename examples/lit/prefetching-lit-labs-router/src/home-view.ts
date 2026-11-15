import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { charactersQueries } from './services/characters/queries'
import './character-item'

class HomeView extends LitElement {
  static properties = {
    selectedChar: { state: true },
  }

  private selectedChar = 1

  private readonly characters = createQueryController(
    this,
    charactersQueries.list(),
  )

  private readonly character = createQueryController(this, () =>
    charactersQueries.detail(this.selectedChar),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private setSelectedChar(event: CustomEvent<number>) {
    this.selectedChar = event.detail
  }

  private renderCharacters() {
    const charactersQuery = this.characters()
    const characterQuery = this.character()

    if (charactersQuery.isPending) return 'Loading...'
    if (charactersQuery.isError) {
      return html`<span>Error: ${charactersQuery.error.message}</span>`
    }

    return html`
      <ul>
        ${charactersQuery.data.results.map(
          (char) => html`
            <character-item
              .characterId=${char.id}
              .name=${char.name}
              @select-character=${this.setSelectedChar}
            ></character-item>
          `,
        )}
      </ul>

      <h3>Selected Character</h3>
      ${
        characterQuery.isPending
          ? 'Loading...'
          : characterQuery.isError
            ? html`<span>Error: ${characterQuery.error.message}</span>`
            : html`<pre>${JSON.stringify(characterQuery.data, null, 2)}</pre>`
      }
    `
  }

  render() {
    return html`
      <div class="App">
        <p>
          Hovering over a character will prefetch it, and when it's been
          prefetched it will turn <strong>bold</strong>. Clicking on a
          prefetched character will show their stats below immediately, and
          opening its details page will render it without a loading state.
        </p>
        <h2>Characters</h2>
        ${this.renderCharacters()}
      </div>
    `
  }
}

customElements.define('home-view', HomeView)
