import { getQueryCache } from './queryCache'
import { defaultConfigRef } from './config'

export async function refetchQuery(queryKey, config = {}) {
  const [
    ,
    queryGroup,
    variablesHash,
    variables,
  ] = defaultConfigRef.current.queryKeySerializerFn(queryKey)

  // If we're simply refetching an existing query, then go find them
  // and call their fetch functions

  if (!queryGroup) {
    return
  }

  return Promise.all(
    Object.values(getQueryCache().cache).map(async query => {
      if (query.queryGroup !== queryGroup) {
        return
      }

      if (variables === false && query.variablesHash) {
        return
      }

      if (variablesHash && query.variablesHash !== variablesHash) {
        return
      }

      await query.fetch({ force: config.force })
    })
  )
}
