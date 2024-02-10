import { delay, HttpResponse, http, passthrough } from 'msw'
import { setupWorker } from 'msw/browser'
import ky from 'ky'

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

export const fetchMovie = (id) => ky.get(`/movies/${id}`).json()
export const fetchMovies = () => ky.get('/movies').json()
export const updateMovie = (id, comment) =>
  ky.post(`/movies/${id}`, { json: { comment } }).json()

export const worker = setupWorker(
  ...[
    http.get('/movies', async () => {
      console.log('movies')
      await delay(1000)
      return HttpResponse.json({
        ts: Date.now(),
        movies: movies.map(({ id, title }) => ({ id, title })),
      })
    }),
    http.get('/movies/:id', async ({ params }) => {
      const { id } = params

      const movie = movies.find((movie) => movie.id === id)
      if (!movie) {
        return new HttpResponse(`Movie with id ${id} not found`, {
          status: 404,
        })
      }

      await delay(1000)
      return HttpResponse.json({ ts: Date.now(), movie })
    }),
    http.post('/movies/:id', async ({ request, params }) => {
      const { id } = params
      const body = await request.json()
      const { comment } = body

      movies.forEach((movie) => {
        if (movie.id === id) {
          movie.comment = comment.toUpperCase()
        }
      })

      await delay(1000)
      return HttpResponse.json({ message: `Successfully updated movie ${id}` })
    }),
    http.get('*.js', () => passthrough()),
    http.get('*.svg', () => passthrough()),
  ],
)
