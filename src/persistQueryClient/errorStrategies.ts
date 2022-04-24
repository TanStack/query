import { PersistedClient } from './persist'

export type PersistErrorHandler = (props: {
  persistedClient: PersistedClient
  error: Error
  errorCount: number
}) => PersistedClient

export const purgeOldestQuery: PersistErrorHandler = ({
  persistedClient,
  error,
}) => {
  const mutations = [...persistedClient.clientState.mutations]
  const queries = [...persistedClient.clientState.queries]
  const client: PersistedClient = {
    ...persistedClient,
    clientState: { mutations, queries },
  }

  // sort queries by dataUpdatedAt (oldest first)
  const sortedQueries = [...queries].sort(
    (a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt
  )

  // clean oldest query
  if (sortedQueries.length > 0) {
    const oldestData = sortedQueries.shift()
    client.clientState.queries = queries.filter(q => q !== oldestData)
    return client
  }

  // throw the original error if we run out of queries to remove
  throw error
}
