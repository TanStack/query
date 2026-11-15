import { getQueryClient, noop } from '@tanstack/marko-query'
import { todoPageQueryOptions } from '../../lib/queries.ts'

export const GET = Run.GET(async (context, next) => {
  await getQueryClient(context).query(todoPageQueryOptions(1)).catch(noop)
  return next()
})
