import * as React from 'react'
import {
  useInfiniteQuery as useRenamedInfiniteQuery,
  useIsFetching as useRenamedIsFetching,
  useIsMutating as useRenamedIsMutating,
  useMutation as useRenamedMutation,
  useQuery as useRenamedQuery,
} from 'react-query'

export const Examples = () => {
  useRenamedQuery(['todos'])
  useRenamedInfiniteQuery(['todos'])
  useRenamedMutation(['todos'])
  useRenamedIsFetching(['todos'])
  useRenamedIsMutating(['todos'])

  return <div>Example Component</div>
}
