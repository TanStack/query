import { infiniteQueryOptions } from '@tanstack/react-query'
import { projectsAPI } from './api'

export const projectsQueries = {
  all: () => ['projects'] as const,
  infinite: () =>
    infiniteQueryOptions({
      queryKey: [...projectsQueries.all(), 'infinite'] as const,
      queryFn: ({ pageParam }) => projectsAPI.getProjects(pageParam),
      initialPageParam: 0,
      getPreviousPageParam: (firstPage) => firstPage.previousId,
      getNextPageParam: (lastPage) => lastPage.nextId,
    }),
}
