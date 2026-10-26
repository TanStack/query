import { queryOptions } from '@tanstack/preact-query'
import { projectsAPI } from './api'

export const projectsQueries = {
  all: () => ['projects'] as const,
  list: (page: number) =>
    queryOptions({
      queryKey: [...projectsQueries.all(), 'list', page] as const,
      queryFn: () => projectsAPI.getProjects(page),
      staleTime: 5000,
    }),
}
