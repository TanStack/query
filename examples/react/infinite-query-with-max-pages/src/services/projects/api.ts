import type { ProjectsPage } from './types'

export const projectsAPI = {
  getProjects: async (cursor: number): Promise<ProjectsPage> => {
    const response = await fetch(`/api/projects?cursor=${cursor}`)
    if (!response.ok) throw new Error('Failed to fetch projects')
    return await response.json()
  },
}
