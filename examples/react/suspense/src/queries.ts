import { queryOptions } from '@tanstack/react-query'

async function fetchProjects(): Promise<
  Array<{ name: string; full_name: string }>
> {
  console.info('Fetching projects')

  const response = await fetch(
    `https://api.github.com/users/TanStack/repos?sort=updated`,
  )
  if (!response.ok) throw new Error('Failed to fetch projects')
  await new Promise((r) => setTimeout(r, 1000))
  return await response.json()
}

async function fetchProject(id: string): Promise<{
  forks_count: number
  stargazers_count: number
  watchers_count: number
}> {
  console.info('Fetching project:', id)

  const response = await fetch(`https://api.github.com/repos/${id}`)
  if (!response.ok) throw new Error('Failed to fetch project')
  await new Promise((r) => setTimeout(r, 1000))
  return await response.json()
}

export const projectsQueryOptions = queryOptions({
  queryKey: ['projects'],
  queryFn: fetchProjects,
})

export const projectQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id),
  })
