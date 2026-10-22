import { infiniteQueryOptions } from '@tanstack/svelte-query'

type Planet = {
  name: string
  population: string
  url: string
}

type PlanetsPage = {
  next: string | null
  results: Array<Planet>
}

const endPoint = 'https://swapi.dev/api'

const fetchPlanets = async (page: number): Promise<PlanetsPage> => {
  const response = await fetch(`${endPoint}/planets/?page=${page}`)
  if (!response.ok) throw new Error('Failed to fetch planets')
  return await response.json()
}

export const planetsInfiniteQueryOptions = infiniteQueryOptions({
  queryKey: ['planets'],
  queryFn: ({ pageParam }) => fetchPlanets(pageParam),
  initialPageParam: 1,
  getNextPageParam: (lastPage) => {
    if (lastPage.next) {
      const nextUrl = new URLSearchParams(new URL(lastPage.next).search)
      const nextCursor = nextUrl.get('page')
      if (nextCursor) {
        return +nextCursor
      }
    }
    return undefined
  },
})
