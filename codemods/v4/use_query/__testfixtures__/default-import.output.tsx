import * as React from 'react'
import { useInfiniteQuery, useMutation, useQuery } from 'react-query'

export const Examples = () => {
  useQuery(['todos'])
  useInfiniteQuery(['todos'])
  useMutation(['todos'])

  return <div>Example Component</div>
}
