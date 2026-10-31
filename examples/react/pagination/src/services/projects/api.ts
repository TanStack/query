import type { ProjectsPage } from './types'

export const projectsAPI = {
  getProjects: async (page = 0): Promise<ProjectsPage> => {
    const response = await fetch(`/api/projects?page=${page}`)
    if (!response.ok) throw new Error('Failed to fetch projects')
    return await response.json()
  },
}
