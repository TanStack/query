export type Planet = {
  name: string
  population: string
  url: string
}

export type PlanetsPage = {
  next: string | null
  results: Array<Planet>
}
