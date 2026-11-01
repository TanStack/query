import type { ProjectsPage } from './types'

export const projectsAPI = {
  getProjects: (page = 0): Promise<ProjectsPage> =>
    $fetch('/api/projects', { query: { page } }),
}
