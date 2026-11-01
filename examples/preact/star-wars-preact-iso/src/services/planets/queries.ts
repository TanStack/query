import { queryOptions } from '@tanstack/preact-query'
import { planetsAPI } from './api'

export const planetsQueries = {
  all: () => ['planets'] as const,
  detail: (planetId: string) =>
    queryOptions({
      queryKey: [...planetsQueries.all(), 'detail', planetId] as const,
      queryFn: () => planetsAPI.getPlanet(planetId),
    }),
}
