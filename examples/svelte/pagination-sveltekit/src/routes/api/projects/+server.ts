import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const page = parseInt(url.searchParams.get('page') ?? '') || 0

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

  return json({ projects, hasMore: page < 9 })
}
