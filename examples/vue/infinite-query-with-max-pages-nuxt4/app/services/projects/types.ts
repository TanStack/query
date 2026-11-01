export type ProjectsPage = {
  data: Array<{ name: string; id: number }>
  previousId: number | null
  nextId: number | null
}
