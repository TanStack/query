import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { episodesQueries } from './services/episodes/queries'
import './episode-character'

const getCharacterId = (url: string) => {
  const characterUrlParts = url.split('/').filter(Boolean)
  return characterUrlParts[characterUrlParts.length - 1]
}

class EpisodeDetail extends LitElement {
  static properties = {
    episodeId: { attribute: false },
  }

  episodeId = ''

  private readonly episode = createQueryController(this, () =>
    episodesQueries.detail(this.episodeId),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const { data, status } = this.episode()

    if (status === 'pending') return html`<p>Loading...</p>`
    if (status === 'error') return html`<p>Error :(</p>`

    return html`
      <div>
        <h2 class="text-4xl">${data.name}</h2>
        <p>${data.air_date}</p>
        <br />
        <h4 class="text-2xl">Characters</h4>
        ${data.characters.map(
          (character) =>
            html`<episode-character
              .characterId=${getCharacterId(character)}
            ></episode-character>`,
        )}
      </div>
    `
  }
}

customElements.define('episode-detail', EpisodeDetail)
