import { queryOptions } from '@tanstack/react-query'
import { locationsAPI } from './api'

export const locationsQueries = {
  all: () => ['locations'] as const,
  detail: (locationId: string) =>
    queryOptions({
      queryKey: [...locationsQueries.all(), 'detail', locationId] as const,
      queryFn: () => locationsAPI.getLocation(locationId),
    }),
}
