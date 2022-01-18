import * as React from 'react'
import {
  useInfiniteQuery as useRenamedInfiniteQuery,
  useMutation as useRenamedMutation,
  useQuery as useRenamedQuery,
} from 'react-query'

export const Examples = () => {
  useRenamedQuery('todos')
  useRenamedInfiniteQuery('todos')
  useRenamedMutation('todos')

  return <div>Example Component</div>
}
