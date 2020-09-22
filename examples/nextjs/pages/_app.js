import React from 'react'
import { ReactQueryCacheProvider, QueryCache } from 'react-query'
import { ReactQueryDevtools } from 'react-query-devtools'
import { Hydrate } from 'react-query/hydration'

const queryCache = new QueryCache()

export default function App({ Component, pageProps }) {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      <Hydrate state={pageProps.dehydratedState}>
        <ReactQueryDevtools initialIsOpen={true} />
        <Component {...pageProps} />
      </Hydrate>
    </ReactQueryCacheProvider>
  )
}
