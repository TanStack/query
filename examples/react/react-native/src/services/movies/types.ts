export type Movie = {
  title: string
  year: number
}

export type MovieDetails = Movie & {
  info: {
    plot: string
    actors: Array<string>
  }
}
