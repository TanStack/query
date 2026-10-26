export type Character = {
  id: number
  name: string
  status: string
  species: string
  gender: string
  origin: { name: string; url: string }
  location: { name: string; url: string }
  episode: Array<string>
}

export type Paginated<T> = {
  results: Array<T>
}
