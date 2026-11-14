import { getQueryClient, noop } from '@tanstack/marko-query'
import { todoFeedQueryOptions } from '../../lib/queries.ts'

export const GET = Run.GET(async (context, next) => {
  await getQueryClient(context).infiniteQuery(todoFeedQueryOptions).catch(noop)
  return next()
})
