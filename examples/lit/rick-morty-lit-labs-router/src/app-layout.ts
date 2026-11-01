import { LitElement, html } from 'lit'
import { Router } from '@lit-labs/router'
import './home-view'
import './episode-list'
import './episode-detail'
import './character-list'
import './character-detail'

class AppLayout extends LitElement {
  private readonly router = new Router(this, [
    { path: '/', render: () => html`<home-view></home-view>` },
    { path: '/episodes', render: () => html`<episode-list></episode-list>` },
    {
      path: '/episodes/:episodeId',
      render: ({ episodeId }) =>
        html`<episode-detail .episodeId=${episodeId}></episode-detail>`,
    },
    {
      path: '/characters',
      render: () => html`<character-list></character-list>`,
    },
    {
      path: '/characters/:characterId',
      render: ({ characterId }) =>
        html`<character-detail .characterId=${characterId}></character-detail>`,
    },
  ])

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <div>
        <nav
          class="bg-gray-300 w-full flex flex-row gap-6 justify-center items-center h-12"
        >
          <a href="/">
            <span class="uppercase hover:underline">Home</span>
          </a>
          <a href="/episodes">
            <span class="uppercase hover:underline">Episodes</span>
          </a>
          <a href="/characters">
            <span class="uppercase hover:underline">Characters</span>
          </a>
        </nav>
        <div class="p-2">${this.router.outlet()}</div>
      </div>
    `
  }
}

customElements.define('app-layout', AppLayout)
