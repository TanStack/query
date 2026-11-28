import {
  createQueryController,
  isError,
  isFetching,
  isPending,
} from '@tanstack/lit-query'
import { LitElement, html } from 'lit'
import { postsQueries } from './services/posts/queries'

class PostDetail extends LitElement {
  static properties = {
    postId: { attribute: false },
  }

  postId = ''

  private readonly post = createQueryController(this, () =>
    postsQueries.detail(this.postId),
  )

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private back(event: Event) {
    event.preventDefault()
    this.dispatchEvent(new CustomEvent('set-post-id', { detail: null }))
  }

  render() {
    const queryResult = this.post()

    return html`
      <div>
        <div>
          <a href="#posts" @click=${this.back}>Back</a>
        </div>
        ${
          isPending(queryResult)
            ? html`<div>Loading...</div>`
            : isError(queryResult)
              ? html`<span>Error: ${queryResult.error.message}</span>`
              : html`
                  <h1>${queryResult.data.title}</h1>
                  <div>
                    <p>${queryResult.data.body}</p>
                  </div>
                  <div>
                    ${isFetching(queryResult) ? 'Background Updating...' : ' '}
                  </div>
                `
        }
      </div>
    `
  }
}

customElements.define('post-detail', PostDetail)
