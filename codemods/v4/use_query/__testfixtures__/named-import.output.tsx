import * as React from 'react'
import {
  useInfiniteQuery as useRenamedInfiniteQuery,
  useIsFetching as useRenamedIsFetching,
  useIsMutating as useRenamedIsMutating,
  useMutation as useRenamedMutation,
  useQueries as useRenamedQueries,
  useQuery as useRenamedQuery,
} from 'react-query'

export const Examples = () => {
  useRenamedQuery(['todos'])
  useRenamedInfiniteQuery(['todos'])
  useRenamedMutation(['todos'])
  useRenamedIsFetching(['todos'])
  useRenamedIsMutating(['todos'])
  useRenamedQueries({
    queries: [query1, query2]
  })

  return <div>Example Component</div>
}
