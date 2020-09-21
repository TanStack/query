import React from 'react'

import { useQueryClient } from './QueryClientProvider'
import { useIsMounted } from './utils'

export function useIsFetching(): number {
  const client = useQueryClient()
  const isMounted = useIsMounted()
  const [isFetching, setIsFetching] = React.useState(client.isFetching())

  React.useEffect(
    () =>
      client.getCache().subscribe(() => {
        if (isMounted()) {
          setIsFetching(client.isFetching())
        }
      }),
    [client, setIsFetching, isMounted]
  )

  return isFetching
}
