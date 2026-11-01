export type Project = {
  id: number
  name: string
}

export type ProjectResponse = {
  data: Array<Project>
  nextId: number | null
  previousId: number | null
}
