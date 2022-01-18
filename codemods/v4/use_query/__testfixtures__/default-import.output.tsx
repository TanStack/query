import * as React from 'react'
import {
  useInfiniteQuery,
  useIsFetching,
  useIsMutating,
  useMutation,
  useQueries,
  useQuery,
} from 'react-query'

export const Examples = () => {
  useQuery(['todos'])
  useInfiniteQuery(['todos'])
  useMutation(['todos'])
  useIsFetching(['todos'])
  useIsMutating(['todos'])
  useQueries({
    queries: [query1, query2]
  })

  return <div>Example Component</div>
}
