import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const cursor = parseInt(url.searchParams.get('cursor') ?? '') || 0
  const pageSize = 4

  const data = Array(pageSize)
    .fill(0)
    .map((_, i) => {
      return {
        name: 'Project ' + (i + cursor) + ` (server time: ${Date.now()})`,
        id: i + cursor,
      }
    })

  const nextId = cursor < 20 ? data[data.length - 1].id + 1 : null
  const previousId = cursor > -20 ? data[0].id - pageSize : null

  await new Promise((r) => setTimeout(r, 300))

  return json({ data, nextId, previousId })
}
