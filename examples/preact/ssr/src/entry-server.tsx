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

export async function render() {
  // The prefetching client: only used to fetch and dehydrate
  const prefetchClient = makeQueryClient()

  await prefetchClient.query(postsQueries.list()).catch(noop)

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
