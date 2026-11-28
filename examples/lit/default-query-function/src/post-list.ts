import {
  createQueryController,
  defaultQueryFn,
  getQueryData,
  isError,
  isFetching,
  isPending,
  useQueryClient,
} from '@tanstack/lit-query'
import { LitElement, html } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import type { Post } from './types'

class PostList extends LitElement {
  private readonly posts = createQueryController<Array<Post>>(this, {
    queryKey: ['/posts'],
    queryFn: defaultQueryFn,
  })

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private setPostId(id: number) {
    this.dispatchEvent(new CustomEvent('set-post-id', { detail: id }))
  }

  render() {
    const queryClient = useQueryClient()
    const queryResult = this.posts()

    return html`
      <div>
        <h1>Posts</h1>
        <div>
          ${
            isPending(queryResult)
              ? html`<div>Loading...</div>`
              : isError(queryResult)
                ? html`<span>Error: ${queryResult.error.message}</span>`
                : html`
                    <div>
                      ${queryResult.data.map(
                        (post) => html`
                          <p>
                            <a
                              href="#${post.id}"
                              style=${styleMap(
                                getQueryData(queryClient, [`/posts/${post.id}`])
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
                    <div>
                      ${isFetching(queryResult) ? 'Background Updating...' : ' '}
                    </div>
                  `
          }
        </div>
      </div>
    `
  }
}

customElements.define('post-list', PostList)
