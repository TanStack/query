import { queryOptions } from '@tanstack/react-query'
import { projectsAPI } from './api'

export const projectsQueries = {
  all: () => ['projects'] as const,
  list: () =>
    queryOptions({
      queryKey: [...projectsQueries.all(), 'list'] as const,
      queryFn: () => projectsAPI.getProjects(),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...projectsQueries.all(), 'detail', id] as const,
      queryFn: () => projectsAPI.getProject(id),
    }),
}
