import express from 'express'
import { renderToReadableStream } from 'react-dom/server'
import { Readable } from 'node:stream'
import { createServer as createViteServer } from 'vite'

import { createDataInjector } from './data-injector.js'

export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production',
  hmrPort?: number,
) {
  const app = express()

  /**
   * @type {import('vite').ViteDevServer}
   */
  const viteDevServer = await createViteServer({
    root,
    logLevel: 'info',
    appType: 'custom',
    server: {
      middlewareMode: true,
      hmr: {
        port: hmrPort,
      },
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  })

  // use vite's connect instance as middleware
  app.use(viteDevServer.middlewares)

  app.use('*', async (req, res) => {
    try {
      const entry = await (async () => {
        if (!isProd) {
          return viteDevServer.ssrLoadModule('/src/entry-server.tsx')
        } else {
          // @ts-expect-error ignore
          return import('./dist/server/entry-server.tsx')
        }
      })()

      const {
        app: reactApp,
        queryClient,
        blockingQueries,
        trackedQueries,
      } = entry.render()

      const appStream = await renderToReadableStream(reactApp, {
        bootstrapModules: ['/@vite/client', '/src/entry-client.tsx'],
        bootstrapScriptContent: [addFastRefreshPreamble()].join('\n'),
      })

      const injector = createDataInjector({
        blockingQueries,
        queryClient,
        trackedQueries,
      })

      // @ts-expect-error
      Readable.fromWeb(appStream.pipeThrough(injector)).pipe(res)
    } catch (e: any) {
      !isProd && viteDevServer.ssrFixStacktrace(e)
      console.log(e.stack)
      res.status(500).end(e.stack)
    }
  })

  return { app, viteDevServer }
}

const { app, viteDevServer } = await createServer()

const server = app.listen(3000, () => {
  console.log('Client Server: http://localhost:3000')
})

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', () => {
    server.close()
    return viteDevServer.close()
  })
}

const addFastRefreshPreamble = () => {
  return `
  var script = document.createElement("script");
  script.type = "module";
  script.text = ${JSON.stringify(fastRefreshPreamble)};
  document.body.appendChild(script);
`.trim()
}

const fastRefreshPreamble = `
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
`.trim()
