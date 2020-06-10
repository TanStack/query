import 'isomorphic-fetch'
import React from 'react'
import { StaticRouter } from 'react-router-dom'
import { matchRoutes } from 'react-router-config'
import express from 'express'
import { renderToString } from 'react-dom/server'
import serialize from 'serialize-javascript'
import { makeServerQueryCache, ReactQueryCacheProvider } from 'react-query'
import App from './App'
import routes from './routes'

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST)

const server = express()
server
  .disable('x-powered-by')
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
  .get('/*', async (req, res) => {
    const queryCache = makeServerQueryCache()
    const matchedRoute = matchRoutes(routes, req.path)[0]
    const prefetch = matchedRoute.route.component.prefetch

    if (prefetch) {
      await prefetch(queryCache, matchedRoute.match.params)
    }

    const context = {}
    const markup = renderToString(
      <ReactQueryCacheProvider queryCache={queryCache}>
        <StaticRouter context={context} location={req.url}>
          <App />
        </StaticRouter>
      </ReactQueryCacheProvider>
    )

    const queries = serialize(queryCache.dehydrate(), { isJSON: true })
    queryCache.clear()

    if (context.url) {
      res.redirect(context.url)
    } else {
      res.status(200).send(
        `<!doctype html>
    <html lang="">
    <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta charset="utf-8" />
        <title>React Query Server Side Rendering Example</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${
          assets.client.css
            ? `<link rel="stylesheet" href="${assets.client.css}">`
            : ''
        }
        ${
          process.env.NODE_ENV === 'production'
            ? `<script src="${assets.client.js}" defer></script>`
            : `<script src="${assets.client.js}" defer crossorigin></script>`
        }
    </head>
    <body>
        <div id="root">${markup}</div>
        <script>
          window.__REACT_QUERY_DATA__ = ${queries}
        </script>
    </body>
</html>`
      )
    }
  })

export default server
