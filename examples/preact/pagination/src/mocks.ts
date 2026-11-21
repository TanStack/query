import { HttpResponse, delay, http } from 'msw'
import { setupWorker } from 'msw/browser'

export const worker = setupWorker(
  http.get('/api/projects', async ({ request }) => {
    const page =
      parseInt(new URL(request.url).searchParams.get('page') ?? '', 10) || 0

    const pageSize = 10

    const projects = Array(pageSize)
      .fill(0)
      .map((_, i) => {
        const id = page * pageSize + (i + 1)
        return {
          name: `Project ${id}`,
          id,
        }
      })

    await delay(1000)

    return HttpResponse.json({ projects, hasMore: page < 9 })
  }),
)
