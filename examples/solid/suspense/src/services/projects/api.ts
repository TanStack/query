import type { Project, ProjectDetail } from './types'

export const projectsAPI = {
  getProjects: async (): Promise<Array<Project>> => {
    console.info('Fetching projects')

    const response = await fetch(
      `https://api.github.com/users/TanStack/repos?sort=updated`,
    )
    if (!response.ok) throw new Error('Failed to fetch projects')
    await new Promise((r) => setTimeout(r, 1000))
    return await response.json()
  },
  getProject: async (id: string): Promise<ProjectDetail> => {
    console.info('Fetching project:', id)

    const response = await fetch(`https://api.github.com/repos/${id}`)
    if (!response.ok) throw new Error('Failed to fetch project')
    await new Promise((r) => setTimeout(r, 1000))
    return await response.json()
  },
}
