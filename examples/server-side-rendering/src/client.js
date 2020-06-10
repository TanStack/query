import App from './App'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'
import { hydrate } from 'react-dom'
import { ReactQueryCacheProvider, makeQueryCache } from 'react-query'

const initialQueries = window.__REACT_QUERY_DATA__
const queryCache = makeQueryCache({ initialQueries })

hydrate(
  <ReactQueryCacheProvider queryCache={queryCache}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ReactQueryCacheProvider>,
  document.getElementById('root')
)

if (module.hot) {
  module.hot.accept()
}
