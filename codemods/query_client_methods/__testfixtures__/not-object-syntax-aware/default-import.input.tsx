import * as React from 'react'
import { useQueryClient } from 'react-query'

export const ExamplesWithGetMutationDefaultsMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.getMutationDefaults('todos')
  queryClient.getMutationDefaults(['todos'])
  queryClient.getMutationDefaults(['todos', 1])
  // Direct hook call.
  useQueryClient().getMutationDefaults('todos')
  useQueryClient().getMutationDefaults(['todos'])
  useQueryClient().getMutationDefaults(['todos', 1])

  return <div>Example Component</div>
}

export const ExamplesWithGetQueriesDataMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.getQueriesData('todos')
  queryClient.getQueriesData(['todos'])
  queryClient.getQueriesData(['todos', 1])
  // Direct hook call.
  useQueryClient().getQueriesData('todos')
  useQueryClient().getQueriesData(['todos'])
  useQueryClient().getQueriesData(['todos', 1])

  return <div>Example Component</div>
}

export const ExamplesWithGetQueryDataMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.getQueryData('todos')
  queryClient.getQueryData('todos', { exact: true })
  queryClient.getQueryData(['todos'])
  queryClient.getQueryData(['todos'], { exact: true })
  // Direct hook call.
  useQueryClient().getQueryData('todos')
  useQueryClient().getQueryData('todos', { exact: true })
  useQueryClient().getQueryData(['todos'])
  useQueryClient().getQueryData(['todos'], { exact: true })

  return <div>Example Component</div>
}

export const ExamplesWithGetQueryDefaultsMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.getQueryDefaults('todos')
  queryClient.getQueryDefaults(['todos'])
  queryClient.getQueryDefaults(['todos', 1])
  // Direct hook call.
  useQueryClient().getQueryDefaults('todos')
  useQueryClient().getQueryDefaults(['todos'])
  useQueryClient().getQueryDefaults(['todos', 1])

  return <div>Example Component</div>
}

export const ExamplesWithGetQueryStateMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.getQueryState('todos')
  queryClient.getQueryState('todos', { exact: true })
  queryClient.getQueryState(['todos'])
  queryClient.getQueryState(['todos'], { exact: true })
  // Direct hook call.
  useQueryClient().getQueryState('todos')
  useQueryClient().getQueryState('todos', { exact: true })
  useQueryClient().getQueryState(['todos'])
  useQueryClient().getQueryState(['todos'], { exact: true })

  return <div>Example Component</div>
}

export const ExamplesWithIsFetchingMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.isFetching('todos')
  queryClient.isFetching('todos', { exact: true })
  queryClient.isFetching(['todos'])
  queryClient.isFetching(['todos'], { exact: true })
  // Direct hook call.
  useQueryClient().isFetching('todos')
  useQueryClient().isFetching('todos', { exact: true })
  useQueryClient().isFetching(['todos'])
  useQueryClient().isFetching(['todos'], { exact: true })

  return <div>Example Component</div>
}

export const ExamplesWithSetMutationDefaultsMethodCall = () => {
  const namedMutationFn = async () => 1
  const namedOptions = { mutationFn: async () => 1, cacheTime: 1000 }
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.setMutationDefaults('todos', { mutationFn: async () => null })
  queryClient.setMutationDefaults('todos', { mutationFn: namedMutationFn })
  queryClient.setMutationDefaults('todos', namedOptions)
  queryClient.setMutationDefaults(['todos'], { mutationFn: async () => null })
  queryClient.setMutationDefaults(['todos'], { mutationFn: namedMutationFn })
  queryClient.setMutationDefaults(['todos'], namedOptions)
  // Direct hook call.
  useQueryClient().setMutationDefaults('todos', {
    mutationFn: async () => null,
  })
  useQueryClient().setMutationDefaults('todos', {
    mutationFn: namedMutationFn,
  })
  useQueryClient().setMutationDefaults('todos', namedOptions)
  useQueryClient().setMutationDefaults(['todos'], {
    mutationFn: async () => null,
  })
  useQueryClient().setMutationDefaults(['todos'], {
    mutationFn: namedMutationFn,
  })
  useQueryClient().setMutationDefaults(['todos'], namedOptions)

  return <div>Example Component</div>
}

export const ExamplesWithSetQueriesDataMethodCall = () => {
  const updaterFn = () => 1
  const namedOptions = { updatedAt: 1000 } as const
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.setQueriesData('todos', () => null)
  queryClient.setQueriesData('todos', updaterFn, { updatedAt: 1 })
  queryClient.setQueriesData('todos', updaterFn, namedOptions)
  queryClient.setQueriesData(['todos'], () => null)
  queryClient.setQueriesData(['todos'], updaterFn, { updatedAt: 1 })
  queryClient.setQueriesData(['todos'], updaterFn, namedOptions)
  // Direct hook call.
  useQueryClient().setQueriesData('todos', () => null)
  useQueryClient().setQueriesData('todos', updaterFn, { updatedAt: 1 })
  useQueryClient().setQueriesData('todos', updaterFn, namedOptions)
  useQueryClient().setQueriesData(['todos'], () => null)
  useQueryClient().setQueriesData(['todos'], updaterFn, { updatedAt: 1 })
  useQueryClient().setQueriesData(['todos'], updaterFn, namedOptions)

  return <div>Example Component</div>
}

export const ExamplesWithSetQueryDataMethodCall = () => {
  const updaterFn = () => 1
  const namedOptions = { updatedAt: 1000 } as const
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.setQueryData('todos', () => null)
  queryClient.setQueryData('todos', updaterFn, { updatedAt: 1 })
  queryClient.setQueryData('todos', updaterFn, namedOptions)
  queryClient.setQueryData(['todos'], () => null)
  queryClient.setQueryData(['todos'], updaterFn, { updatedAt: 1 })
  queryClient.setQueryData(['todos'], updaterFn, namedOptions)
  // Direct hook call.
  useQueryClient().setQueryData('todos', () => null)
  useQueryClient().setQueryData('todos', updaterFn, { updatedAt: 1 })
  useQueryClient().setQueryData('todos', updaterFn, namedOptions)
  useQueryClient().setQueryData(['todos'], () => null)
  useQueryClient().setQueryData(['todos'], updaterFn, { updatedAt: 1 })
  useQueryClient().setQueryData(['todos'], updaterFn, namedOptions)

  return <div>Example Component</div>
}

export const ExamplesWithSetQueryDefaultsMethodCall = () => {
  const namedQueryFn = () => 1
  const namedOptions = { queryFn: () => 1, cacheTime: 1000 }
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.setQueryDefaults('todos', { queryFn: async () => null })
  queryClient.setQueryDefaults('todos', { queryFn: namedQueryFn })
  queryClient.setQueryDefaults('todos', namedOptions)
  queryClient.setQueryDefaults(['todos'], { queryFn: async () => null })
  queryClient.setQueryDefaults(['todos'], { queryFn: namedQueryFn })
  queryClient.setQueryDefaults(['todos'], namedOptions)
  // Direct hook call.
  useQueryClient().setQueryDefaults('todos', { queryFn: async () => null })
  useQueryClient().setQueryDefaults('todos', { queryFn: namedQueryFn })
  useQueryClient().setQueryDefaults('todos', namedOptions)
  useQueryClient().setQueryDefaults(['todos'], { queryFn: async () => null })
  useQueryClient().setQueryDefaults(['todos'], { queryFn: namedQueryFn })
  useQueryClient().setQueryDefaults(['todos'], namedOptions)

  return <div>Example Component</div>
}
