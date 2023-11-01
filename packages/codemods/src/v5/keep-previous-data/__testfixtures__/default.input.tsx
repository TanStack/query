import * as React from 'react'
import axios from 'axios'
import { useQueries, useQuery, useQueryClient, QueryClient } from '@tanstack/react-query'

type Post = {
  id: number
  title: string
  body: string
}

const queryFn = async (): Promise<Array<Post>> => {
  const { data } = await axios.get(
    'https://jsonplaceholder.typicode.com/posts',
  )
  return data
}

/**
 * The object expression has a `keepPreviousData` property with value `true`, so the codemod should transform
 * this usage.
 */
export const Example1 = () => {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: queryFn,
    keepPreviousData: true,
  })

  return <div>{JSON.stringify(data)}</div>
}

/**
 * The object expression has a `keepPreviousData` property with value `true`, but the `placeholderData` is a function.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example2 = () => {
  const { data } = useQueries({
    queryKey: ['posts'],
    queryFn: queryFn,
    keepPreviousData: true,
    placeholderData: () => previousData
  })

  return <div>{JSON.stringify(data)}</div>
}

/**
 * The object expression has a `keepPreviousData` property with value `true`, but the `placeholderData` is a string.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example3 = () => {
  const { data } = useQueries({
    queryKey: ['posts'],
    queryFn: queryFn,
    keepPreviousData: true,
    placeholderData: 'somePlaceholderData'
  })

  return <div>{JSON.stringify(data)}</div>
}

/**
 * The object expression has a `keepPreviousData` property with value `false`.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example4 = () => {
  const { data } = useQueries({
    queryKey: ['posts'],
    queryFn: queryFn,
    keepPreviousData: false,
  })

  return <div>{JSON.stringify(data)}</div>
}

/**
 * The object expression has a `keepPreviousData` property with which is an identifier.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example5 = () => {
  const keepPreviousDataIdentifier = false
  const { data } = useQueries({
    queryKey: ['posts'],
    queryFn: queryFn,
    keepPreviousData: keepPreviousDataIdentifier,
    placeholderData: () => previousData
  })

  return <div>{JSON.stringify(data)}</div>
}

/**
 * The object expression has a `keepPreviousData` property with value `true`, so the codemod should transform
 * this usage.
 */
export const Example6 = () => {
  const queryClient = new QueryClient()

  queryClient.setQueryDefaults(['key'], {
    keepPreviousData: true
  })

  useQueryClient().setQueryDefaults(['key'], {
    keepPreviousData: true
  })

  const anotherQueryClient = useQueryClient()

  anotherQueryClient.setQueryDefaults(['key'], {
    keepPreviousData: true
  })
}

/**
 * The object expression has a `keepPreviousData` property with value `true`, but the `placeholderData` is a function.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example7 = () => {
  const queryClient = new QueryClient()

  queryClient.setQueryDefaults(['key'], {
    keepPreviousData: true,
    placeholderData: () => previousData
  })

  useQueryClient().setQueryDefaults(['key'], {
    keepPreviousData: true,
    placeholderData: () => previousData
  })

  const anotherQueryClient = useQueryClient()

  anotherQueryClient.setQueryDefaults(['key'], {
    keepPreviousData: true,
    placeholderData: () => previousData
  })
}

/**
 * The object expression has a `keepPreviousData` property with value `true`, but the `placeholderData` is a string.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example8 = () => {
  const queryClient = new QueryClient()

  queryClient.setQueryDefaults(['key'], {
    keepPreviousData: true,
    placeholderData: 'somePlaceholderData'
  })

  useQueryClient().setQueryDefaults(['key'], {
    keepPreviousData: true,
    placeholderData: 'somePlaceholderData'
  })

  const anotherQueryClient = useQueryClient()

  anotherQueryClient.setQueryDefaults(['key'], {
    keepPreviousData: true,
    placeholderData: 'somePlaceholderData'
  })
}

/**
 * The object expression has a `keepPreviousData` property with value `false`.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example9 = () => {
  const queryClient = new QueryClient()

  queryClient.setQueryDefaults(['key'], {
    keepPreviousData: false,
  })

  useQueryClient().setQueryDefaults(['key'], {
    keepPreviousData: false,
  })

  const anotherQueryClient = useQueryClient()

  anotherQueryClient.setQueryDefaults(['key'], {
    keepPreviousData: false,
  })
}

/**
 * The object expression has a `keepPreviousData` property with which is an identifier.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example10 = () => {
  const queryClient = new QueryClient()
  const keepPreviousDataIdentifier = false

  queryClient.setQueryDefaults(['key'], {
    keepPreviousData: keepPreviousDataIdentifier,
    placeholderData: () => previousData
  })

  useQueryClient().setQueryDefaults(['key'], {
    keepPreviousData: keepPreviousDataIdentifier,
    placeholderData: () => previousData
  })

  const anotherQueryClient = useQueryClient()

  anotherQueryClient.setQueryDefaults(['key'], {
    keepPreviousData: keepPreviousDataIdentifier,
    placeholderData: () => previousData
  })
}

/**
 * The object expression has a `keepPreviousData` property with value `true`, so the codemod should transform
 * this usage.
 */
export const Example11 = () => {
  new QueryClient({
    defaultOptions: {
      queries: {
        keepPreviousData: true
      }
    }
  })
}

/**
 * The object expression has a `keepPreviousData` property with value `true`, but the `placeholderData` is a function.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example12 = () => {
  new QueryClient({
    defaultOptions: {
      queries: {
        keepPreviousData: true,
        placeholderData: () => previousData
      }
    }
  })
}

/**
 * The object expression has a `keepPreviousData` property with value `true`, but the `placeholderData` is a string.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example13 = () => {
  new QueryClient({
    defaultOptions: {
      queries: {
        keepPreviousData: true,
        placeholderData: 'somePlaceholderData'
      }
    }
  })
}

/**
 * The object expression has a `keepPreviousData` property with value `false`.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example14 = () => {
  new QueryClient({
    defaultOptions: {
      queries: {
        keepPreviousData: false,
      }
    }
  })
}

/**
 * The object expression has a `keepPreviousData` property with which is an identifier.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example15 = () => {
  const keepPreviousDataIdentifier = false
  new QueryClient({
    defaultOptions: {
      queries: {
        keepPreviousData: keepPreviousDataIdentifier,
        placeholderData: () => previousData
      }
    }
  })
}
