import { LitElement, html } from 'lit'
import { Router } from '@lit-labs/router'
import './home-view'
import './film-list'
import './film-detail'
import './character-list'
import './character-detail'

class AppLayout extends LitElement {
  private readonly router = new Router(this, [
    { path: '/', render: () => html`<home-view></home-view>` },
    { path: '/films', render: () => html`<film-list></film-list>` },
    {
      path: '/films/:filmId',
      render: ({ filmId }) =>
        html`<film-detail .filmId=${filmId}></film-detail>`,
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
          <a href="/films">
            <span class="uppercase hover:underline">Films</span>
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
