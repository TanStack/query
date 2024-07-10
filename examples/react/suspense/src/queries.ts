export async function fetchProjects() {
  console.info('fetch projects')

  const response = await fetch(
    `https://api.github.com/users/tannerlinsley/repos?sort=updated`,
  )
  await new Promise((r) => setTimeout(r, 1000))
  return await response.json()
}

export async function fetchProject(id: string) {
  console.info('fetch project id', id)

  const response = await fetch(
    `https://api.github.com/repos/tannerlinsley/${id}`,
  )
  await new Promise((r) => setTimeout(r, 1000))
  return await response.json()
}
