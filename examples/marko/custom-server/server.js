// A plain Node server: Vite in middleware mode plus Marko templates. No Marko
// Run. This is the whole integration surface the adapter needs on a custom
// server: one `$global` per request, prefetch with `getQueryClient`, render.
import { createServer as createHttpServer } from 'node:http'
import { createServer as createViteServer } from 'vite'
import { DEMO_PORT } from './config/port.js'

const vite = await createViteServer({
  server: { middlewareMode: true, hmr: { port: DEMO_PORT + 100 } },
  appType: 'custom',
})

const server = createHttpServer((req, res) => {
  vite.middlewares(req, res, async () => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost')
      // Loaded through Vite so the templates and the server share modules.
      const { routes } = await vite.ssrLoadModule('/src/routes.ts')
      const { getQueryClient } = await vite.ssrLoadModule(
        '@tanstack/marko-query',
      )

      const route = routes[url.pathname]
      if (!route) {
        res.statusCode = 404
        res.end('Not found')
        return
      }

      // One `$global` per request. Never reuse it for another request.
      const $global = { pathname: url.pathname }
      await route.prefetch?.(getQueryClient($global))

      res.setHeader('content-type', 'text/html; charset=utf-8')
      route.template.render({ $global }).pipe(res)
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error))
      vite.ssrFixStacktrace(cause)
      console.error(cause)
      res.statusCode = 500
      res.end(cause.stack ?? String(cause))
    }
  })
})

server.listen(DEMO_PORT, () => {
  console.log(`http://localhost:${DEMO_PORT}`)
})
