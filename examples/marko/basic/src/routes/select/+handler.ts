import { getQueryClient, noop } from '@tanstack/marko-query'
import { selectQueryOptions } from '../../lib/queries.ts'

export const GET = Run.GET(async (context, next) => {
  await getQueryClient(context).query(selectQueryOptions).catch(noop)
  return next()
})
