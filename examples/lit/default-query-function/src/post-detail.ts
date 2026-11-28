import {
  createQueryController,
  defaultQueryFn,
  isError,
  isFetching,
  isPending,
} from '@tanstack/lit-query'
import { LitElement, html } from 'lit'
import type { Post } from './types'

class PostDetail extends LitElement {
  static properties = {
    postId: { attribute: false },
  }

  postId = -1

  private readonly post = createQueryController<Post>(this, () => ({
    queryKey: [`/posts/${this.postId}`],
    queryFn: defaultQueryFn,
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
    const queryResult = this.post()

    return html`
      <div>
        <div>
          <a href="#posts" @click=${this.back}>Back</a>
        </div>
        ${
          !this.postId || isPending(queryResult)
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
