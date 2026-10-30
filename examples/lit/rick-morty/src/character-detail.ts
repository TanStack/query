import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { charactersQueries } from './services/characters/queries'
import './character-episode'
import './location-detail'

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

    const locationId = getId(data.location.url)

    return html`
      <div>
        <h2 class="text-4xl">${data.name}</h2>
        <p><strong>Gender</strong>: ${data.gender}</p>
        <p><strong>Status</strong>: ${data.status}</p>
        <p><strong>Species</strong>: ${data.species}</p>
        <p><strong>Origin</strong>: ${data.origin.name}</p>
        <p>
          <strong>Location</strong>:
          ${
            locationId
              ? html`<location-detail
                  .locationId=${locationId}
                ></location-detail>`
              : data.location.name
          }
        </p>

        <h4 class="text-2xl pt-4">Episodes</h4>
        ${data.episode.map(
          (episode) =>
            html`<character-episode
              .episodeId=${getId(episode)}
            ></character-episode>`,
        )}
      </div>
    `
  }
}

customElements.define('character-detail', CharacterDetail)
