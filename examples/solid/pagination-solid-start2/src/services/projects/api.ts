import type { ProjectsPage } from './types'

export const projectsAPI = {
  getProjects: async (page = 0): Promise<ProjectsPage> => {
    'use server'

    const pageSize = 10

    const projects = Array(pageSize)
      .fill(0)
      .map((_, i) => {
        const id = page * pageSize + (i + 1)
        return {
          name: 'Project ' + id,
          id,
        }
      })

    await new Promise((r) => setTimeout(r, 1000))

    return { projects, hasMore: page < 9 }
  },
}
