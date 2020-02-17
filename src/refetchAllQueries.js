import { queries } from './utils'

export async function refetchAllQueries({
  includeInactive,
  force = includeInactive,
  shouldRefetchQuery,
} = {}) {
  return Promise.all(
    queries.map(async query => {
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
