export type Project = {
  id: number
  name: string
}

export type ProjectResponse = {
  projects: Array<Project>
  hasMore: boolean
}
