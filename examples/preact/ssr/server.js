import fs from 'node:fs/promises'
import express from 'express'

const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'
const serverEntry = './dist/server/entry-server.js'

const templateHtml = isProduction
  ? await fs.readFile('./dist/client/index.html', 'utf-8')
  : ''

const app = express()

/** @type {import('vite').ViteDevServer | undefined} */
let vite
if (!isProduction) {
  const { createServer } = await import('vite')
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  })
  app.use(vite.middlewares)
} else {
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default
  app.use(compression())
  app.use(base, sirv('./dist/client', { extensions: [] }))
}

app.use('*all', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '')

    /** @type {string} */
    let template
    /** @type {typeof import('./src/entry-server').render} */
    let render
    if (vite) {
      template = await fs.readFile('./index.html', 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
    } else {
      template = templateHtml
      render = (await import(serverEntry)).render
    }

    const rendered = await render()

    const html = template
      .replace(`<!--app-html-->`, rendered.html)
      .replace(`<!--app-state-->`, rendered.state)

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
  } catch (error) {
    const e = /** @type {Error} */ (error)
    vite?.ssrFixStacktrace(e)
    console.log(e.stack)
    res.status(500).end(isProduction ? 'Internal Server Error' : e.stack)
  }
})

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})
