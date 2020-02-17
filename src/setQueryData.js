import { queries, defaultConfigRef } from './utils'

import { refetchQuery } from './refetchQuery'

export function setQueryData(
  userQueryKey,
  updater,
  { shouldRefetch = true } = {}
) {
  const [queryHash] = defaultConfigRef.current.queryKeySerializerFn(
    userQueryKey
  )

  if (!queryHash) {
    return
  }

  const query = queries.find(d => d.queryHash === queryHash)

  if (!query) {
    return
  }

  query.setData(updater)

  if (shouldRefetch) {
    return refetchQuery(userQueryKey)
  }
}
