import { mutationOptions, queryOptions } from '@tanstack/lit-query'
import { projectsAPI } from './api'
import type { CreateProjectInput, ToggleProjectFavoriteInput } from './types'

export const projectsQueries = {
  all: () => ['projects'] as const,
  list: (page: number, delayMs: number, forceError: boolean) =>
    queryOptions({
      queryKey: [
        ...projectsQueries.all(),
        'list',
        page,
        delayMs,
        forceError,
      ] as const,
      queryFn: () => projectsAPI.getProjects(page, delayMs, forceError),
    }),
}

export const projectsMutations = {
  create: () =>
    mutationOptions({
      mutationKey: [...projectsQueries.all(), 'create'] as const,
      mutationFn: async (input: CreateProjectInput) => {
        const response = await projectsAPI.createProject(input)
        return response.project
      },
    }),
  updateFavorite: () =>
    mutationOptions({
      mutationKey: [...projectsQueries.all(), 'update-favorite'] as const,
      mutationFn: async (input: ToggleProjectFavoriteInput) => {
        const response = await projectsAPI.updateProjectFavorite(input)
        return response.project
      },
    }),
}
