import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { charactersQueries } from './services/characters/queries'

const getPersonId = (url: string) => {
  const personUrlParts = url.split('/').filter(Boolean)
  return personUrlParts[personUrlParts.length - 1]
}

class CharacterList extends LitElement {
  private readonly characters = createQueryController(
    this,
    charactersQueries.list(),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const { data, status } = this.characters()

    if (status === 'pending') return html`<p>Loading...</p>`
    if (status === 'error') return html`<p>Error :(</p>`

    return html`
      <div>
        <h2 class="text-4xl">Characters</h2>
        ${data.results.map(
          (person) => html`
            <article>
              <a
                class="text-blue-500 hover:underline"
                href="/characters/${getPersonId(person.url)}"
              >
                <h6 class="text-xl">${person.name}</h6>
              </a>
            </article>
          `,
        )}
      </div>
    `
  }
}

customElements.define('character-list', CharacterList)
