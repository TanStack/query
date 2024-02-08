import { delay, http, HttpResponse, passthrough } from 'msw'

export const handlers = [
  http.get('*.js', () => passthrough()),
  http.get('/api/projects', async ({ request }) => {
    const url = new URL(request.url)

    const cursor = parseInt(<string>url.searchParams.get('cursor')) || 0
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
    await delay()
    return HttpResponse.json({ data, nextId, previousId })
  }),
]
