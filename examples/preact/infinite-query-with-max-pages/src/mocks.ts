import { HttpResponse, delay, http } from 'msw'
import { setupWorker } from 'msw/browser'

export const worker = setupWorker(
  http.get('/api/projects', async ({ request }) => {
    const cursor =
      parseInt(new URL(request.url).searchParams.get('cursor') ?? '', 10) || 0
    const pageSize = 4

    const data = Array(pageSize)
      .fill(0)
      .map((_, i) => {
        return {
          name: `Project ${i + cursor} (server time: ${Date.now()})`,
          id: i + cursor,
        }
      })

    const nextId = cursor < 20 ? data[data.length - 1].id + 1 : null
    const previousId = cursor > -20 ? data[0].id - pageSize : null

    await delay(300)

    return HttpResponse.json({ data, nextId, previousId })
  }),
)
