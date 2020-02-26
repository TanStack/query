// an endpoint for getting projects data
export default (req, res) => {
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

  setTimeout(() => res.json({ projects, hasMore: page < 9 }), 1000)
}
