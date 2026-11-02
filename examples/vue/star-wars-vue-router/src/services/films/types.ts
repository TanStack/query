export type Film = {
  title: string
  episode_id: number
  opening_crawl: string
  release_date: string
  characters: Array<string>
  url: string
}

export type Paginated<T> = {
  results: Array<T>
}
