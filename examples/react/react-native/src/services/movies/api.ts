import movies from '../../data/movies.json'
import type { Movie, MovieDetails } from './types'

function delay(t: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, t)
  })
}

export const moviesAPI = {
  getMovies: async (): Promise<Array<Movie>> => {
    console.log('getMovies')

    await delay(200 + Math.floor(Math.random() * 2000))

    return Promise.resolve(
      movies
        .slice(0, 100)
        .map((movie) => ({ title: movie.title, year: movie.year })),
    )
  },
  getMovie: async (title: string): Promise<MovieDetails> => {
    console.log('getMovie', title)

    await delay(200 + Math.floor(Math.random() * 2000))

    const result = movies.filter((item) => item.title === title)

    if (result.length === 0) {
      throw new Error('Movie not found')
    }
    return Promise.resolve(result[0] as MovieDetails)
  },
}
