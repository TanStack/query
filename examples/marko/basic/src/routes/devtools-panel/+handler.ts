import { getQueryClient, noop } from '@tanstack/marko-query'
import { devtoolsQueryOptions } from '../../lib/queries.ts'

export const GET = Run.GET(async (context, next) => {
  await getQueryClient(context).query(devtoolsQueryOptions).catch(noop)
  return next()
})
