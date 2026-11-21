import type { PersistedClient } from './persist'

/**
 * Called when saving the persisted client fails. Returns a smaller client to try saving again, or
 * `undefined` to give up.
 */
export type PersistRetryer = (props: {
  persistedClient: PersistedClient
  error: Error
  errorCount: number
}) => PersistedClient | undefined

/**
 * A {@link PersistRetryer} that drops the query with the oldest `dataUpdatedAt` and tries again, until
 * no queries are left.
 * @param props - The `persistedClient` that failed to save.
 * @returns A copy of the client without its oldest query, or `undefined` if it has no queries.
 */
export const removeOldestQuery: PersistRetryer = ({ persistedClient }) => {
  const mutations = [...persistedClient.clientState.mutations]
  const queries = [...persistedClient.clientState.queries]
  const client: PersistedClient = {
    ...persistedClient,
    clientState: { mutations, queries },
  }

  // sort queries by dataUpdatedAt (oldest first)
  const sortedQueries = [...queries].sort(
    (a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt,
  )

  // clean oldest query
  if (sortedQueries.length > 0) {
    const oldestData = sortedQueries.shift()
    client.clientState.queries = queries.filter((q) => q !== oldestData)
    return client
  }

  return undefined
}
