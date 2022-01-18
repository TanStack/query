import * as React from 'react'
import {
  useInfiniteQuery,
  useIsFetching,
  useIsMutating,
  useMutation,
  useQuery,
} from 'react-query'

export const Examples = () => {
  useQuery(['todos'])
  useInfiniteQuery(['todos'])
  useMutation(['todos'])
  useIsFetching(['todos'])
  useIsMutating(['todos'])

  return <div>Example Component</div>
}
