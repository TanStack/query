// an endpoint for getting projects data
export default async (req, res) => {
  const page = parseInt(req.query.page) || 0

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

  await new Promise(r => setTimeout(r, 1000))

  res.json({ projects, hasMore: page < 9 })
}
