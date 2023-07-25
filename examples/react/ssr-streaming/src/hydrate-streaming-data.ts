import { DehydratedState, QueryClient, hydrate } from '@tanstack/react-query'

declare global {
  export let $TQD: DehydratedState[]
  export let $TQS: (data: DehydratedState) => void
}

export const hydrateStreamingData = ({
  queryClient,
}: {
  queryClient: QueryClient
}) => {
  function hydrateData(data: DehydratedState) {
    hydrate(queryClient, data)
  }

  // Insert data that was already streamed before this point
  // @ts-expect-error
  ;(globalThis.$TQD ?? []).map(hydrateData)

  // Delete the global variable so that it doesn't get serialized again
  // @ts-expect-error
  delete globalThis.$TQD

  // From now on, insert data directly
  // @ts-expect-error
  globalThis.$TQS = hydrateData
}
