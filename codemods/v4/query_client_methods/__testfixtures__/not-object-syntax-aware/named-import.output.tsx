import * as React from 'react'
import { useQueryClient as useRenamedQueryClient } from 'react-query'

export const ExamplesWithGetMutationDefaultsMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.getMutationDefaults(['todos'])
  queryClient.getMutationDefaults(['todos'])
  queryClient.getMutationDefaults(['todos', 1])
  // Direct hook call.
  useRenamedQueryClient().getMutationDefaults(['todos'])
  useRenamedQueryClient().getMutationDefaults(['todos'])
  useRenamedQueryClient().getMutationDefaults(['todos', 1])

  return <div>Example Component</div>
}

export const ExamplesWithGetQueriesDataMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.getQueriesData(['todos'])
  queryClient.getQueriesData(['todos'])
  queryClient.getQueriesData(['todos', 1])
  // Direct hook call.
  useRenamedQueryClient().getQueriesData(['todos'])
  useRenamedQueryClient().getQueriesData(['todos'])
  useRenamedQueryClient().getQueriesData(['todos', 1])

  return <div>Example Component</div>
}

export const ExamplesWithGetQueryDataMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.getQueryData(['todos'])
  queryClient.getQueryData(['todos'], { exact: true })
  queryClient.getQueryData(['todos'])
  queryClient.getQueryData(['todos'], { exact: true })
  // Direct hook call.
  useRenamedQueryClient().getQueryData(['todos'])
  useRenamedQueryClient().getQueryData(['todos'], { exact: true })
  useRenamedQueryClient().getQueryData(['todos'])
  useRenamedQueryClient().getQueryData(['todos'], { exact: true })

  return <div>Example Component</div>
}

export const ExamplesWithGetQueryDefaultsMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.getQueryDefaults(['todos'])
  queryClient.getQueryDefaults(['todos'])
  queryClient.getQueryDefaults(['todos', 1])
  // Direct hook call.
  useRenamedQueryClient().getQueryDefaults(['todos'])
  useRenamedQueryClient().getQueryDefaults(['todos'])
  useRenamedQueryClient().getQueryDefaults(['todos', 1])

  return <div>Example Component</div>
}

export const ExamplesWithGetQueryStateMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.getQueryState(['todos'])
  queryClient.getQueryState(['todos'], { exact: true })
  queryClient.getQueryState(['todos'])
  queryClient.getQueryState(['todos'], { exact: true })
  // Direct hook call.
  useRenamedQueryClient().getQueryState(['todos'])
  useRenamedQueryClient().getQueryState(['todos'], { exact: true })
  useRenamedQueryClient().getQueryState(['todos'])
  useRenamedQueryClient().getQueryState(['todos'], { exact: true })

  return <div>Example Component</div>
}

export const ExamplesWithIsFetchingMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.isFetching(['todos'])
  queryClient.isFetching(['todos'], { exact: true })
  queryClient.isFetching(['todos'])
  queryClient.isFetching(['todos'], { exact: true })
  // Direct hook call.
  useRenamedQueryClient().isFetching(['todos'])
  useRenamedQueryClient().isFetching(['todos'], { exact: true })
  useRenamedQueryClient().isFetching(['todos'])
  useRenamedQueryClient().isFetching(['todos'], { exact: true })

  return <div>Example Component</div>
}

export const ExamplesWithSetMutationDefaultsMethodCall = () => {
  const namedMutationFn = async () => 1
  const namedOptions = { mutationFn: async () => 1, cacheTime: 1000 }
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.setMutationDefaults(['todos'], { mutationFn: async () => null })
  queryClient.setMutationDefaults(['todos'], { mutationFn: namedMutationFn })
  queryClient.setMutationDefaults(['todos'], namedOptions)
  queryClient.setMutationDefaults(['todos'], { mutationFn: async () => null })
  queryClient.setMutationDefaults(['todos'], { mutationFn: namedMutationFn })
  queryClient.setMutationDefaults(['todos'], namedOptions)
  // Direct hook call.
  useRenamedQueryClient().setMutationDefaults(['todos'], {
    mutationFn: async () => null,
  })
  useRenamedQueryClient().setMutationDefaults(['todos'], {
    mutationFn: namedMutationFn,
  })
  useRenamedQueryClient().setMutationDefaults(['todos'], namedOptions)
  useRenamedQueryClient().setMutationDefaults(['todos'], {
    mutationFn: async () => null,
  })
  useRenamedQueryClient().setMutationDefaults(['todos'], {
    mutationFn: namedMutationFn,
  })
  useRenamedQueryClient().setMutationDefaults(['todos'], namedOptions)

  return <div>Example Component</div>
}

export const ExamplesWithSetQueriesDataMethodCall = () => {
  const updaterFn = () => 1
  const namedOptions = { updatedAt: 1000 } as const
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.setQueriesData(['todos'], () => null)
  queryClient.setQueriesData(['todos'], updaterFn, { updatedAt: 1 })
  queryClient.setQueriesData(['todos'], updaterFn, namedOptions)
  queryClient.setQueriesData(['todos'], () => null)
  queryClient.setQueriesData(['todos'], updaterFn, { updatedAt: 1 })
  queryClient.setQueriesData(['todos'], updaterFn, namedOptions)
  // Direct hook call.
  useRenamedQueryClient().setQueriesData(['todos'], () => null)
  useRenamedQueryClient().setQueriesData(['todos'], updaterFn, { updatedAt: 1 })
  useRenamedQueryClient().setQueriesData(['todos'], updaterFn, namedOptions)
  useRenamedQueryClient().setQueriesData(['todos'], () => null)
  useRenamedQueryClient().setQueriesData(['todos'], updaterFn, { updatedAt: 1 })
  useRenamedQueryClient().setQueriesData(['todos'], updaterFn, namedOptions)

  return <div>Example Component</div>
}

export const ExamplesWithSetQueryDataMethodCall = () => {
  const updaterFn = () => 1
  const namedOptions = { updatedAt: 1000 } as const
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.setQueryData(['todos'], () => null)
  queryClient.setQueryData(['todos'], updaterFn, { updatedAt: 1 })
  queryClient.setQueryData(['todos'], updaterFn, namedOptions)
  queryClient.setQueryData(['todos'], () => null)
  queryClient.setQueryData(['todos'], updaterFn, { updatedAt: 1 })
  queryClient.setQueryData(['todos'], updaterFn, namedOptions)
  // Direct hook call.
  useRenamedQueryClient().setQueryData(['todos'], () => null)
  useRenamedQueryClient().setQueryData(['todos'], updaterFn, { updatedAt: 1 })
  useRenamedQueryClient().setQueryData(['todos'], updaterFn, namedOptions)
  useRenamedQueryClient().setQueryData(['todos'], () => null)
  useRenamedQueryClient().setQueryData(['todos'], updaterFn, { updatedAt: 1 })
  useRenamedQueryClient().setQueryData(['todos'], updaterFn, namedOptions)

  return <div>Example Component</div>
}

export const ExamplesWithSetQueryDefaultsMethodCall = () => {
  const namedQueryFn = () => 1
  const namedOptions = { queryFn: () => 1, cacheTime: 1000 }
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.setQueryDefaults(['todos'], { queryFn: async () => null })
  queryClient.setQueryDefaults(['todos'], { queryFn: namedQueryFn })
  queryClient.setQueryDefaults(['todos'], namedOptions)
  queryClient.setQueryDefaults(['todos'], { queryFn: async () => null })
  queryClient.setQueryDefaults(['todos'], { queryFn: namedQueryFn })
  queryClient.setQueryDefaults(['todos'], namedOptions)
  // Direct hook call.
  useRenamedQueryClient().setQueryDefaults(['todos'], {
    queryFn: async () => null,
  })
  useRenamedQueryClient().setQueryDefaults(['todos'], { queryFn: namedQueryFn })
  useRenamedQueryClient().setQueryDefaults(['todos'], namedOptions)
  useRenamedQueryClient().setQueryDefaults(['todos'], {
    queryFn: async () => null,
  })
  useRenamedQueryClient().setQueryDefaults(['todos'], { queryFn: namedQueryFn })
  useRenamedQueryClient().setQueryDefaults(['todos'], namedOptions)

  return <div>Example Component</div>
}
