import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { commentsQueries } from './services/comments/queries'
import { postsQueries } from './services/posts/queries'
import { usersQueries } from './services/users/queries'
import type { QueryClient, QueryResultAccessor } from '@tanstack/lit-query'
import type { Comment } from './services/comments/types'
import type { Post } from './services/posts/types'
import type { User } from './services/users/types'

export class SsrApp extends LitElement {
  static properties = {
    queryClient: { attribute: false },
  }

  queryClient?: QueryClient

  private postsQuery?: QueryResultAccessor<Array<Post>, Error>
  private authorQuery?: QueryResultAccessor<User, Error>
  private commentsQuery?: QueryResultAccessor<Array<Comment>, Error>

  protected override willUpdate(): void {
    if (this.postsQuery || !this.queryClient) return

    // This query was prefetched on the server, so its data is already in the
    // server-rendered markup and is available immediately on the client
    const postsQuery = createQueryController(
      this,
      postsQueries.list(),
      this.queryClient,
    )
    this.postsQuery = postsQuery

    // This query depends on the posts, and was prefetched on the server as well.
    // The posts are already in the cache here, prefetched on the server and
    // hydrated on the client, so the author's id is known when it's created
    this.authorQuery = createQueryController(
      this,
      usersQueries.detail(postsQuery().data?.[0]?.userId),
      this.queryClient,
    )

    // This query was not prefetched on the server and will not start
    // fetching until on the client, both patterns are fine to mix
    this.commentsQuery = createQueryController(
      this,
      commentsQueries.list(),
      this.queryClient,
    )
  }

  protected override render() {
    if (!this.postsQuery || !this.authorQuery || !this.commentsQuery) {
      return html`<p>Loading...</p>`
    }

    const posts = this.postsQuery()
    const author = this.authorQuery()
    const comments = this.commentsQuery()

    return html`
      <div>
        <h1>Server Rendering with Lit Query</h1>
        <h2>Comments</h2>
        <p>
          ${
            comments.isPending
              ? 'Loading comments on the client...'
              : comments.isError
                ? `Error: ${comments.error.message}`
                : `${comments.data.length} comments`
          }
        </p>
        <h2>Author of the first post</h2>
        <p>
          ${
            author.isPending
              ? 'Loading author...'
              : author.isError
                ? `Error: ${author.error.message}`
                : author.data.name
          }
        </p>
        <h2>Posts</h2>
        ${
          posts.isPending
            ? 'Loading posts...'
            : posts.isError
              ? html`<span>Error: ${posts.error.message}</span>`
              : html`
                  <ul>
                    ${posts.data.map((post) => html`<li>${post.title}</li>`)}
                  </ul>
                `
        }
      </div>
    `
  }
}

if (!customElements.get('ssr-app')) {
  customElements.define('ssr-app', SsrApp)
}

declare global {
  interface HTMLElementTagNameMap {
    'ssr-app': SsrApp
  }
}
