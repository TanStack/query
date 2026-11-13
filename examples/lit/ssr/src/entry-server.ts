import { render as renderLit } from '@lit-labs/ssr'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'
import { html } from 'lit'
import { uneval } from 'devalue'
import { dehydrate, hydrate, noop } from '@tanstack/lit-query'
import { makeQueryClient } from './makeQueryClient'
import { postsQueries } from './services/posts/queries'
import { usersQueries } from './services/users/queries'
import './app'

export async function render() {
  // The prefetching client: only used to fetch and dehydrate
  const prefetchClient = makeQueryClient()

  // The posts are critical content: without `.catch(noop)`, a failed fetch
  // throws here and the server responds with an error status
  const posts = await prefetchClient.query(postsQueries.list())

  // The author depends on the first post, so prefetch it once its id is known.
  // It's not critical: on failure it's left out of the dehydrated state and
  // fetched again on the client
  const authorId = posts[0]?.userId
  if (authorId) {
    await prefetchClient.query(usersQueries.detail(authorId)).catch(noop)
  }

  const dehydratedState = dehydrate(prefetchClient)

  // The render client: hydrated with the same state and passed to the element
  // with a property binding, so its controllers read the prefetched cache
  const renderClient = makeQueryClient()
  hydrate(renderClient, dehydratedState)

  const appHtml = await collectResult(
    renderLit(html`<ssr-app .queryClient=${renderClient}></ssr-app>`),
  )

  // `uneval` escapes the state so it can't break out of the <script> tag
  return { html: appHtml, state: uneval(dehydratedState) }
}
