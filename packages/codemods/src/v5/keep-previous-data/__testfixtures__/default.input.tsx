import * as React from 'react'
import axios from 'axios'
import { useQueries, useQuery } from '@tanstack/react-query'

type Post = {
  id: number
  title: string
  body: string
}

export const Example1 = () => {
  const queryFn = async (): Promise<Array<Post>> => {
    const { data } = await axios.get(
      'https://jsonplaceholder.typicode.com/posts',
    )
    return data
  }
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: queryFn,
    keepPreviousData: true,
  })

  return <div>{JSON.stringify(data)}</div>
}

export const Example2 = () => {
  const queryFn = async (): Promise<Array<Post>> => {
    const { data } = await axios.get(
        'https://jsonplaceholder.typicode.com/posts',
    )
    return data
  }
  const { data } = useQueries({
    queryKey: ['posts'],
    queryFn: queryFn,
    keepPreviousData: true,
    placeholderData: (previousData) => previousData
  })

  return <div>{JSON.stringify(data)}</div>
}
