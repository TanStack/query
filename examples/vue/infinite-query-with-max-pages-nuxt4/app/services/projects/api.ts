import type { ProjectsPage } from './types'

export const projectsAPI = {
  getProjects: (cursor: number): Promise<ProjectsPage> =>
    $fetch('/api/projects', { query: { cursor } }),
}
