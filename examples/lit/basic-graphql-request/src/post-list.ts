import { LitElement, html } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import { createQueryController, useQueryClient } from '@tanstack/lit-query'
import { postsQueries } from './services/posts/queries'

class PostList extends LitElement {
  private readonly posts = createQueryController(this, postsQueries.list())

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private setPostId(id: string) {
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
                                queryClient.getQueryData(
                                  postsQueries.detail(post.id).queryKey,
                                )
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
