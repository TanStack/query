import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { episodesQueries } from './services/episodes/queries'

class EpisodeList extends LitElement {
  private readonly episodes = createQueryController(
    this,
    episodesQueries.list(),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const { data, status } = this.episodes()

    if (status === 'pending') return html`<p>Loading...</p>`
    if (status === 'error') return html`<p>Error :(</p>`

    return html`
      <div>
        <h2 class="text-4xl">Episodes</h2>
        ${data.results.map(
          (episode) => html`
            <article>
              <a
                class="text-blue-500 hover:underline"
                href="/episodes/${episode.id}"
              >
                <h6 class="text-xl">
                  ${episode.episode} - ${episode.name}
                  <em>${episode.air_date}</em>
                </h6>
              </a>
            </article>
          `,
        )}
      </div>
    `
  }
}

customElements.define('episode-list', EpisodeList)
