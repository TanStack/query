import { getQueryClient, noop } from '@tanstack/marko-query'
import { subscribedQueryOptions } from '../../lib/queries.ts'

// Only the shared key is prefetched. `todoUncachedQueryKey` stays empty on
// purpose, so the page can show that an opted-out tag does not fetch it.
export const GET = Run.GET(async (context, next) => {
  await getQueryClient(context).query(subscribedQueryOptions).catch(noop)
  return next()
})
