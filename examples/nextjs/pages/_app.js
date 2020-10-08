import React from 'react'
import { ReactQueryCacheProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query-devtools'
import { Hydrate } from 'react-query/hydration'

export default function App({ Component, pageProps }) {
  return (
    <ReactQueryCacheProvider>
      <Hydrate state={pageProps.dehydratedState}>
        <ReactQueryDevtools initialIsOpen={true} />
        <Component {...pageProps} />
      </Hydrate>
    </ReactQueryCacheProvider>
  )
}
