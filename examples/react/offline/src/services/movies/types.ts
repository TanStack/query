export type Movie = {
  comment: string
  id: string
  title: string
}

export type MovieResponse = {
  ts: number
  movie: Movie
}

export type MoviesResponse = {
  ts: number
  movies: Array<Pick<Movie, 'id' | 'title'>>
}

export type UpdateMovieResponse = {
  message: string
}
