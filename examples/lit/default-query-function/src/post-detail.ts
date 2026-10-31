import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import type { Post } from './types'

class PostDetail extends LitElement {
  static properties = {
    postId: { attribute: false },
  }

  postId = -1

  // You can even leave out the queryFn and just go straight into options
  private readonly post = createQueryController<Post>(this, () => ({
    queryKey: [`/posts/${this.postId}`],
    enabled: !!this.postId,
  }))

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private back(event: Event) {
    event.preventDefault()
    this.dispatchEvent(new CustomEvent('set-post-id', { detail: -1 }))
  }

  render() {
    const { isPending, isError, isFetching, data, error } = this.post()

    return html`
      <div>
        <div>
          <a href="#posts" @click=${this.back}>Back</a>
        </div>
        ${
          !this.postId || isPending
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
