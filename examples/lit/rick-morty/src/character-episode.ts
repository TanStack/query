import { LitElement, html, nothing } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { episodesQueries } from './services/episodes/queries'

class CharacterEpisode extends LitElement {
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

    if (status !== 'success') return nothing

    return html`
      <article>
        <a
          class="text-blue-500 hover:underline"
          href="/episodes/${this.episodeId}"
        >
          <h6 class="text-lg">
            ${data.episode}. ${data.name} - ${data.air_date}
          </h6>
        </a>
      </article>
    `
  }
}

customElements.define('character-episode', CharacterEpisode)
