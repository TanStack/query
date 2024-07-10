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

export async function fetchProject(id: string): Promise<{
  forks_count: number
  stargazers_count: number
  watchers_count: number
}> {
  console.info('Fetching project:', id)

  const response = await fetch(`https://api.github.com/repos/${id}`)
  await new Promise((r) => setTimeout(r, 1000))
  return await response.json()
}
