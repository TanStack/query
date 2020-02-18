import { getQueryCache } from './queryCache'

import { refetchQuery } from './refetchQuery'

export function setQueryData(
  userQueryKey,
  updater,
  { shouldRefetch = true } = {}
) {
  const query = getQueryCache().getByKey(userQueryKey)

  if (!query) {
    return
  }

  query.setData(updater)

  if (shouldRefetch) {
    return refetchQuery(userQueryKey)
  }
}
