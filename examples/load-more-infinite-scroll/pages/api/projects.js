// an endpoint for getting projects data
export default (req, res) => {
  const cursor = parseInt(req.query.cursor) || 0

  const data = Array(5)
    .fill(0)
    .map((_, i) => {
      return {
        name: 'Project ' + (i + cursor) + ` (server time: ${Date.now()})`,
        id: i + cursor,
      }
    })

  const nextId = cursor < 10 ? data[data.length - 1].id + 1 : null

  setTimeout(() => res.json({ data, nextId }), 1000)
}
