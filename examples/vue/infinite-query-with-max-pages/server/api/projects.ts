export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const cursor =
    typeof query.cursor === 'string' ? parseInt(query.cursor) || 0 : 0
  const pageSize = 4

  const data = Array(pageSize)
    .fill(0)
    .map((_, i) => {
      return {
        name: 'Project ' + (i + cursor) + ` (server time: ${Date.now()})`,
        id: i + cursor,
      }
    })

  const nextId = cursor < 20 ? data[data.length - 1]!.id + 1 : null
  const previousId = cursor > -20 ? data[0]!.id - pageSize : null

  await new Promise((r) => setTimeout(r, 300))

  return { data, nextId, previousId }
})
