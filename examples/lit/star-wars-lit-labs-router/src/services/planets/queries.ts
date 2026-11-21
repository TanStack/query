import { queryOptions } from '@tanstack/lit-query'
import { planetsAPI } from './api'

export const planetsQueries = {
  all: () => ['planets'] as const,
  detail: (planetId: string) =>
    queryOptions({
      queryKey: [...planetsQueries.all(), 'detail', planetId] as const,
      queryFn: () => planetsAPI.getPlanet(planetId),
    }),
}
