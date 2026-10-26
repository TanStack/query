import { renderToString } from 'preact-render-to-string'
import { uneval } from 'devalue'
import {
  QueryClientProvider,
  dehydrate,
  hydrate,
  noop,
} from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import App from './App'
import { makeQueryClient } from './makeQueryClient'
import { postsQueries } from './services/posts/queries'
import { usersQueries } from './services/users/queries'

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

  // The render client: hydrated with the same state, used for renderToString
  const renderClient = makeQueryClient()
  hydrate(renderClient, dehydratedState)

  const html = renderToString(
    <QueryClientProvider client={renderClient}>
      <App />
      <PreactQueryDevtools />
    </QueryClientProvider>,
  )

  // `uneval` escapes the state so it can't break out of the <script> tag
  return { html, state: uneval(dehydratedState) }
}
