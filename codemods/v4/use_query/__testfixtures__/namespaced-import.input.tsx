import * as React from 'react'
import * as RQ from 'react-query'

export const Examples = () => {
  RQ.useQuery('todos')
  RQ.useInfiniteQuery('todos')

  return <div>Example Component</div>
}
