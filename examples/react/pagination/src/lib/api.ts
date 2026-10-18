import { queryOptions } from '@tanstack/react-query'

const fetchProjects = async (
  page = 0,
): Promise<{
  projects: Array<{ name: string; id: number }>
  hasMore: boolean
}> => {
  const response = await fetch(`/api/projects?page=${page}`)
  if (!response.ok) throw new Error('Failed to fetch projects')
  return await response.json()
}

export const projectsQueryOptions = (page: number) =>
  queryOptions({
    queryKey: ['projects', page],
    queryFn: () => fetchProjects(page),
    staleTime: 5000,
  })
