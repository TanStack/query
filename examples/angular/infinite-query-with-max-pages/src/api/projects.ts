import { parse as parseUrl } from 'url'
import { parse as parseQuery } from 'querystring'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Connect } from 'vite'

export function mockAPI(
  req: IncomingMessage,
  res: ServerResponse,
  next: Connect.NextFunction,
) {
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  if (req.url?.startsWith('/api')) {
    delay(300).then(() => {
      if (req.url?.startsWith('/api/projects')) {
        const parsedUrl = parseUrl(req.url)
        const queryParams = parseQuery(parsedUrl.query || '')
        const cursor = parseInt(<string>queryParams.cursor) || 0

        const pageSize = 4

        const data = Array(pageSize)
          .fill(0)
          .map((_, i) => {
            return {
              name: 'Project ' + (i + cursor) + ` (server time: ${Date.now()})`,
              id: i + cursor,
            }
          })

        const nextId = cursor < 20 ? data[data.length - 1].id + 1 : null
        const previousId = cursor > -20 ? data[0].id - pageSize : null

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ data, nextId, previousId }))
        return
      }
    })
  } else {
    next()
  }
}
