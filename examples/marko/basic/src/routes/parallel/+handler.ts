import { getQueryClient, noop } from '@tanstack/marko-query'
import { todoCountQueryOptions } from '../../lib/queries.ts'

export const GET = Run.GET(async (context, next) => {
  const client = getQueryClient(context)
  await Promise.all([
    client.query(todoCountQueryOptions('all')).catch(noop),
    client.query(todoCountQueryOptions('completed')).catch(noop),
    client.query(todoCountQueryOptions('active')).catch(noop),
  ])
  return next()
})
