import { queryOptions } from "@tanstack/react-query";

export async function fetchProjects(): Promise<
  Array<{ name: string; full_name: string }>
> {
  console.info('Fetching projects')

  const response = await fetch(
    `https://api.github.com/users/TanStack/repos?sort=updated`,
  )
  await new Promise((r) => setTimeout(r, 1000))
  return await response.json()
}

export const projectsQuery = () => queryOptions({
  queryKey: ['projects'],
  queryFn: fetchProjects,
})

export async function fetchProject(id: string): Promise<{
  full_name: string
  forks_count: number
  stargazers_count: number
  watchers_count: number
}> {
  console.info('Fetching project:', id)

  const response = await fetch(`https://api.github.com/repos/${id}`)
  await new Promise((r) => setTimeout(r, 1000))
  return await response.json()
}

export const projectQuery = (id: string) => queryOptions({
  queryKey: ['project', id],
  queryFn: () => fetchProject(id),
})