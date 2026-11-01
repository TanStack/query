import { HttpResponse, delay, http, passthrough } from 'msw'
import { setupWorker } from 'msw/browser'

const movies = [
  {
    id: '1',
    title: 'Guardians of the Galaxy',
    comment: '',
  },
  {
    id: '2',
    title: 'Wall-E',
    comment: '',
  },
]

export const worker = setupWorker(
  http.get('/movies', async () => {
    await delay(500)
    return HttpResponse.json({
      ts: Date.now(),
      movies: movies.map(({ id, title }) => ({ id, title })),
    })
  }),

  http.get('/movies/:id', async ({ params }) => {
    const { id } = params

    const movie = movies.find((item) => item.id === id)

    if (!movie) {
      return new HttpResponse(`Movie with id ${id} not found`, {
        status: 404,
      })
    }

    await delay(500)
    return HttpResponse.json({ ts: Date.now(), movie })
  }),

  http.post<{ id: string }, { comment: string }>(
    '/movies/:id',
    async ({ request, params }) => {
      const { id } = params
      const body = await request.json()
      const { comment } = body

      movies.forEach((movie) => {
        if (movie.id === id) {
          movie.comment = comment.toUpperCase()
        }
      })

      await delay(500)
      return HttpResponse.json({ message: `Successfully updated movie ${id}` })
    },
  ),
  http.get('*.js', () => passthrough()),
  http.get('*.svg', () => passthrough()),
)
