import * as React from 'react'
import { useQuery, useInfiniteQuery } from 'react-query'

export const Examples = () => {
  useQuery(['todos'])
  useInfiniteQuery(['todos'])

  return <div>Example Component</div>
}
