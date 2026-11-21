export type Character = {
  name: string
  height: string
  mass: string
  hair_color: string
  eye_color: string
  birth_year: string
  homeworld: string
  films: Array<string>
  url: string
}

export type Paginated<T> = {
  results: Array<T>
}
