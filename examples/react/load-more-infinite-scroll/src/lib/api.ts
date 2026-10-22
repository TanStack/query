import { infiniteQueryOptions } from '@tanstack/react-query'

const fetchProjects = async (
  cursor: number,
): Promise<{
  data: Array<{ name: string; id: number }>
  previousId: number | null
  nextId: number | null
}> => {
  const response = await fetch(`/api/projects?cursor=${cursor}`)
  if (!response.ok) throw new Error('Failed to fetch projects')
  return await response.json()
}

export const projectsInfiniteQueryOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getPreviousPageParam: (firstPage) => firstPage.previousId,
  getNextPageParam: (lastPage) => lastPage.nextId,
})
