export type Project = {
  id: number
  name: string
  owner: string
  isFavorite: boolean
}

export type ProjectsPageResponse = {
  page: number
  pageSize: number
  totalPages: number
  totalProjects: number
  hasMore: boolean
  projects: Array<Project>
  requestMeta: {
    totalRequestCount: number
    pageRequestCount: number
    totalMutationCount: number
  }
}

export type CreateProjectInput = {
  name: string
  owner: string
}

export type ToggleProjectFavoriteInput = {
  id: number
  isFavorite: boolean
}

export type ProjectMutationResponse = {
  project: Project
  mutationCount: number
}

export type ProjectsQueryKey = readonly [
  'projects',
  'list',
  number,
  number,
  boolean,
]
