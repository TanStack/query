export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = typeof query.page === 'string' ? parseInt(query.page) || 0 : 0

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
})
