import { getQueryCache } from './queryCache'

export async function refetchAllQueries({
  includeInactive,
  force = includeInactive,
  shouldRefetchQuery,
} = {}) {
  return Promise.all(
    Object.values(getQueryCache().cache).map(async query => {
      if (
        typeof shouldRefetchQuery !== 'undefined' &&
        !shouldRefetchQuery(query)
      ) {
        return
      }
      if (query.instances.length || includeInactive) {
        return query.fetch({ force })
      }
    })
  )
}
