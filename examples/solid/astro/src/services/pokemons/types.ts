export type Pokemon = {
  name: string
  stats: Array<{ base_stat: number; stat: { name: string } }>
}

export type PokemonList = {
  results: Array<{ name: string; url: string }>
}
