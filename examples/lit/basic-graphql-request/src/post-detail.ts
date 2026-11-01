import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
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
    const { isPending, isError, isFetching, data, error } = this.post()

    return html`
      <div>
        <div>
          <a href="#posts" @click=${this.back}>Back</a>
        </div>
        ${
          isPending
            ? html`<div>Loading...</div>`
            : isError
              ? html`<span>Error: ${error.message}</span>`
              : html`
                  <h1>${data.title}</h1>
                  <div>
                    <p>${data.body}</p>
                  </div>
                  <div>${isFetching ? 'Background Updating...' : ' '}</div>
                `
        }
      </div>
    `
  }
}

customElements.define('post-detail', PostDetail)
