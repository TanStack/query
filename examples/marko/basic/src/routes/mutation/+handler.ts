import { getQueryClient, noop } from '@tanstack/marko-query'
import { todosQueryOptions } from '../../lib/queries.ts'

export const GET = Run.GET(async (context, next) => {
  await getQueryClient(context).query(todosQueryOptions).catch(noop)
  return next()
})
