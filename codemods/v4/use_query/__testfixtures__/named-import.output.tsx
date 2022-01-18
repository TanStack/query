import * as React from 'react'
import {
  useQuery as useRenamedQuery,
  useInfiniteQuery as useRenamedInfiniteQuery,
} from 'react-query'

export const Examples = () => {
  useRenamedQuery(['todos'])
  useRenamedInfiniteQuery(['todos'])

  return <div>Example Component</div>
}
