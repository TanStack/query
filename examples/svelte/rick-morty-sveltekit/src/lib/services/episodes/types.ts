export type Episode = {
  id: number
  name: string
  air_date: string
  episode: string
  characters: Array<string>
}

export type Paginated<T> = {
  results: Array<T>
}
