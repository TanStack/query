type Snapshot = {
  status: 'pending' | 'success' | 'error'
  fetchStatus: 'idle' | 'fetching' | 'paused'
  data: unknown
  dataUpdateCount: number
  errorUpdateCount: number
  fetchDirection: 'forward' | 'backward' | undefined
}

type Predicate = (result: Snapshot) => boolean

const queryFlags = [
  'isPending',
  'isSuccess',
  'isError',
  'isFetching',
  'isPaused',
  'isLoading',
  'isRefetching',
  'isLoadingError',
  'isRefetchError',
  'isFetched',
] as const
const pageFlags = [
  'isFetchingNextPage',
  'isFetchingPreviousPage',
  'isFetchNextPageError',
  'isFetchPreviousPageError',
] as const

/**
 * Projects observer snapshots through the adapter's public predicates for behavioral comparisons.
 * @param predicates - The public status predicates exposed by the adapter.
 * @returns A projection that compares the public query state and its derived statuses.
 */
export function createQueryResultSnapshot(
  predicates: Record<
    (typeof queryFlags)[number] | (typeof pageFlags)[number],
    Predicate
  >,
) {
  /**
   * Materializes query predicates before matching recorded observer snapshots.
   * @param value - The recorded result or list of results.
   * @returns The snapshot including its derived statuses.
   */
  function snapshot(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(snapshot)
    if (
      !value ||
      typeof value !== 'object' ||
      !('refetch' in value) ||
      !('dataUpdateCount' in value)
    )
      return value

    const result = value as unknown as Snapshot
    const {
      dataUpdateCount: _updates,
      fetchDirection: _direction,
      ...fields
    } = result
    const flags =
      'fetchNextPage' in value ? [...queryFlags, ...pageFlags] : queryFlags
    return {
      ...fields,
      ...Object.fromEntries(
        flags.map((flag) => [flag, predicates[flag](result)]),
      ),
    }
  }
  return snapshot
}
