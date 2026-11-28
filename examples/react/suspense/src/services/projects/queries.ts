import { suspenseQueryOptions } from '@tanstack/react-query'
import { projectsAPI } from './api'

export const projectsQueries = {
  all: () => ['projects'] as const,
  list: () =>
    suspenseQueryOptions({
      queryKey: [...projectsQueries.all(), 'list'] as const,
      queryFn: () => projectsAPI.getProjects(),
    }),
  detail: (id: string) =>
    suspenseQueryOptions({
      queryKey: [...projectsQueries.all(), 'detail', id] as const,
      queryFn: () => projectsAPI.getProject(id),
    }),
}
