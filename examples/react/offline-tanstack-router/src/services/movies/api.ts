import type {
  MovieResponse,
  MoviesResponse,
  UpdateMovieResponse,
} from './types'

export const moviesAPI = {
  getMovie: async (id: string): Promise<MovieResponse> => {
    const response = await fetch(`/movies/${id}`)
    if (!response.ok) {
      throw new Error(await response.text())
    }
    return await response.json()
  },
  getMovies: async (): Promise<MoviesResponse> => {
    const response = await fetch('/movies')
    if (!response.ok) {
      throw new Error(await response.text())
    }
    return await response.json()
  },
  updateMovie: async (
    id: string,
    comment: string,
  ): Promise<UpdateMovieResponse> => {
    const response = await fetch(`/movies/${id}`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) {
      throw new Error(await response.text())
    }
    return await response.json()
  },
}
