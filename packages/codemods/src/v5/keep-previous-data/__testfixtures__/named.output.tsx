import * as React from 'react'
import axios from 'axios'
import {
  keepPreviousData,
  useQueries as useRenamedUseQueries,
  useQuery as useRenamedUseQuery,
  useQueryClient as useRenamedUseQueryClient,
  QueryClient as RenamedQueryClient,
} from '@tanstack/react-query';

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
  const { data } = useRenamedUseQuery({
    queryKey: ['posts'],
    queryFn: queryFn,
    placeholderData: keepPreviousData
  })

  return <div>{JSON.stringify(data)}</div>
}

/**
 * The object expression has a `keepPreviousData` property with value `true`, but the `placeholderData` is a function.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example2 = () => {
  const { data } = useRenamedUseQuery({
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
  const { data } = useRenamedUseQueries({
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
  const { data } = useRenamedUseQueries({
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
  const { data } = useRenamedUseQueries({
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
  const queryClient = new RenamedQueryClient()

  queryClient.setQueryDefaults(['key'], {
    placeholderData: keepPreviousData
  })

  useRenamedUseQueryClient().setQueryDefaults(['key'], {
    placeholderData: keepPreviousData
  })

  const anotherQueryClient = useRenamedUseQueryClient()

  anotherQueryClient.setQueryDefaults(['key'], {
    placeholderData: keepPreviousData
  })
}

/**
 * The object expression has a `keepPreviousData` property with value `true`, but the `placeholderData` is a function.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example7 = () => {
  const queryClient = new RenamedQueryClient()

  queryClient.setQueryDefaults(['key'], {
    keepPreviousData: true,
    placeholderData: () => previousData
  })

  useRenamedUseQueryClient().setQueryDefaults(['key'], {
    keepPreviousData: true,
    placeholderData: () => previousData
  })

  const anotherQueryClient = useRenamedUseQueryClient()

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
  const queryClient = new RenamedQueryClient()

  queryClient.setQueryDefaults(['key'], {
    keepPreviousData: true,
    placeholderData: 'somePlaceholderData'
  })

  useRenamedUseQueryClient().setQueryDefaults(['key'], {
    keepPreviousData: true,
    placeholderData: 'somePlaceholderData'
  })

  const anotherQueryClient = useRenamedUseQueryClient()

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
  const queryClient = new RenamedQueryClient()

  queryClient.setQueryDefaults(['key'], {
    keepPreviousData: false,
  })

  useRenamedUseQueryClient().setQueryDefaults(['key'], {
    keepPreviousData: false,
  })

  const anotherQueryClient = useRenamedUseQueryClient()

  anotherQueryClient.setQueryDefaults(['key'], {
    keepPreviousData: false,
  })
}

/**
 * The object expression has a `keepPreviousData` property with which is an identifier.
 * The codemod shouldn't transform this case, only warn the user about the manual migration.
 */
export const Example10 = () => {
  const queryClient = new RenamedQueryClient()
  const keepPreviousDataIdentifier = false

  queryClient.setQueryDefaults(['key'], {
    keepPreviousData: keepPreviousDataIdentifier,
    placeholderData: () => previousData
  })

  useRenamedUseQueryClient().setQueryDefaults(['key'], {
    keepPreviousData: keepPreviousDataIdentifier,
    placeholderData: () => previousData
  })

  const anotherQueryClient = useRenamedUseQueryClient()

  anotherQueryClient.setQueryDefaults(['key'], {
    keepPreviousData: keepPreviousDataIdentifier,
    placeholderData: () => previousData
  })
}
