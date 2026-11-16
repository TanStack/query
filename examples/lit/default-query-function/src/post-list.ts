import { LitElement, html } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import { createQueryController, useQueryClient } from '@tanstack/lit-query'
import type { Post } from './types'

class PostList extends LitElement {
  // All you have to do now is pass a key!
  private readonly posts = createQueryController<Array<Post>>(this, {
    queryKey: ['/posts'],
  })

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private setPostId(id: number) {
    this.dispatchEvent(new CustomEvent('set-post-id', { detail: id }))
  }

  render() {
    const queryClient = useQueryClient()
    const { isPending, isError, isFetching, data, error } = this.posts()

    return html`
      <div>
        <h1>Posts</h1>
        <div>
          ${
            isPending
              ? html`<div>Loading...</div>`
              : isError
                ? html`<span>Error: ${error.message}</span>`
                : html`
                    <div>
                      ${data.map(
                        (post) => html`
                          <p>
                            <a
                              href="#${post.id}"
                              style=${styleMap(
                                queryClient.getQueryData([`/posts/${post.id}`])
                                  ? { fontWeight: 'bold', color: 'green' }
                                  : {},
                              )}
                              @click=${(event: Event) => {
                                event.preventDefault()
                                this.setPostId(post.id)
                              }}
                            >
                              ${post.title}
                            </a>
                          </p>
                        `,
                      )}
                    </div>
                    <div>${isFetching ? 'Background Updating...' : ' '}</div>
                  `
          }
        </div>
      </div>
    `
  }
}

customElements.define('post-list', PostList)
