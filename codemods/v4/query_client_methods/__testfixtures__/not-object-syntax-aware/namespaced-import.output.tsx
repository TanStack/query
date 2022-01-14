import * as React from 'react'
import * as RQ from 'react-query'

export const ExamplesWithGetMutationDefaultsMethodCall = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.getMutationDefaults(['todos'])
  queryClient.getMutationDefaults(['todos'])
  queryClient.getMutationDefaults(['todos', 1])
  // Direct hook call.
  RQ.useQueryClient().getMutationDefaults(['todos'])
  RQ.useQueryClient().getMutationDefaults(['todos'])
  RQ.useQueryClient().getMutationDefaults(['todos', 1])

  return <div>Example Component</div>
}

export const ExamplesWithGetQueriesDataMethodCall = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.getQueriesData(['todos'])
  queryClient.getQueriesData(['todos'])
  queryClient.getQueriesData(['todos', 1])
  // Direct hook call.
  RQ.useQueryClient().getQueriesData(['todos'])
  RQ.useQueryClient().getQueriesData(['todos'])
  RQ.useQueryClient().getQueriesData(['todos', 1])

  return <div>Example Component</div>
}

export const ExamplesWithGetQueryDataMethodCall = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.getQueryData(['todos'])
  queryClient.getQueryData(['todos'], { exact: true })
  queryClient.getQueryData(['todos'])
  queryClient.getQueryData(['todos'], { exact: true })
  // Direct hook call.
  RQ.useQueryClient().getQueryData(['todos'])
  RQ.useQueryClient().getQueryData(['todos'], { exact: true })
  RQ.useQueryClient().getQueryData(['todos'])
  RQ.useQueryClient().getQueryData(['todos'], { exact: true })

  return <div>Example Component</div>
}

export const ExamplesWithGetQueryDefaultsMethodCall = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.getQueryDefaults(['todos'])
  queryClient.getQueryDefaults(['todos'])
  queryClient.getQueryDefaults(['todos', 1])
  // Direct hook call.
  RQ.useQueryClient().getQueryDefaults(['todos'])
  RQ.useQueryClient().getQueryDefaults(['todos'])
  RQ.useQueryClient().getQueryDefaults(['todos', 1])

  return <div>Example Component</div>
}

export const ExamplesWithGetQueryStateMethodCall = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.getQueryState(['todos'])
  queryClient.getQueryState(['todos'], { exact: true })
  queryClient.getQueryState(['todos'])
  queryClient.getQueryState(['todos'], { exact: true })
  // Direct hook call.
  RQ.useQueryClient().getQueryState(['todos'])
  RQ.useQueryClient().getQueryState(['todos'], { exact: true })
  RQ.useQueryClient().getQueryState(['todos'])
  RQ.useQueryClient().getQueryState(['todos'], { exact: true })

  return <div>Example Component</div>
}

export const ExamplesWithIsFetchingMethodCall = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.isFetching(['todos'])
  queryClient.isFetching(['todos'], { exact: true })
  queryClient.isFetching(['todos'])
  queryClient.isFetching(['todos'], { exact: true })
  // Direct hook call.
  RQ.useQueryClient().isFetching(['todos'])
  RQ.useQueryClient().isFetching(['todos'], { exact: true })
  RQ.useQueryClient().isFetching(['todos'])
  RQ.useQueryClient().isFetching(['todos'], { exact: true })

  return <div>Example Component</div>
}

export const ExamplesWithSetMutationDefaultsMethodCall = () => {
  const namedMutationFn = async () => 1
  const namedOptions = { mutationFn: async () => 1, cacheTime: 1000 }
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.setMutationDefaults(['todos'], { mutationFn: async () => null })
  queryClient.setMutationDefaults(['todos'], { mutationFn: namedMutationFn })
  queryClient.setMutationDefaults(['todos'], namedOptions)
  queryClient.setMutationDefaults(['todos'], { mutationFn: async () => null })
  queryClient.setMutationDefaults(['todos'], { mutationFn: namedMutationFn })
  queryClient.setMutationDefaults(['todos'], namedOptions)
  // Direct hook call.
  RQ.useQueryClient().setMutationDefaults(['todos'], {
    mutationFn: async () => null,
  })
  RQ.useQueryClient().setMutationDefaults(['todos'], {
    mutationFn: namedMutationFn,
  })
  RQ.useQueryClient().setMutationDefaults(['todos'], namedOptions)
  RQ.useQueryClient().setMutationDefaults(['todos'], {
    mutationFn: async () => null,
  })
  RQ.useQueryClient().setMutationDefaults(['todos'], {
    mutationFn: namedMutationFn,
  })
  RQ.useQueryClient().setMutationDefaults(['todos'], namedOptions)

  return <div>Example Component</div>
}

export const ExamplesWithSetQueriesDataMethodCall = () => {
  const updaterFn = () => 1
  const namedOptions = { updatedAt: 1000 } as const
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.setQueriesData(['todos'], () => null)
  queryClient.setQueriesData(['todos'], updaterFn, { updatedAt: 1 })
  queryClient.setQueriesData(['todos'], updaterFn, namedOptions)
  queryClient.setQueriesData(['todos'], () => null)
  queryClient.setQueriesData(['todos'], updaterFn, { updatedAt: 1 })
  queryClient.setQueriesData(['todos'], updaterFn, namedOptions)
  // Direct hook call.
  RQ.useQueryClient().setQueriesData(['todos'], () => null)
  RQ.useQueryClient().setQueriesData(['todos'], updaterFn, { updatedAt: 1 })
  RQ.useQueryClient().setQueriesData(['todos'], updaterFn, namedOptions)
  RQ.useQueryClient().setQueriesData(['todos'], () => null)
  RQ.useQueryClient().setQueriesData(['todos'], updaterFn, { updatedAt: 1 })
  RQ.useQueryClient().setQueriesData(['todos'], updaterFn, namedOptions)

  return <div>Example Component</div>
}

export const ExamplesWithSetQueryDataMethodCall = () => {
  const updaterFn = () => 1
  const namedOptions = { updatedAt: 1000 } as const
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.setQueryData(['todos'], () => null)
  queryClient.setQueryData(['todos'], updaterFn, { updatedAt: 1 })
  queryClient.setQueryData(['todos'], updaterFn, namedOptions)
  queryClient.setQueryData(['todos'], () => null)
  queryClient.setQueryData(['todos'], updaterFn, { updatedAt: 1 })
  queryClient.setQueryData(['todos'], updaterFn, namedOptions)
  // Direct hook call.
  RQ.useQueryClient().setQueryData(['todos'], () => null)
  RQ.useQueryClient().setQueryData(['todos'], updaterFn, { updatedAt: 1 })
  RQ.useQueryClient().setQueryData(['todos'], updaterFn, namedOptions)
  RQ.useQueryClient().setQueryData(['todos'], () => null)
  RQ.useQueryClient().setQueryData(['todos'], updaterFn, { updatedAt: 1 })
  RQ.useQueryClient().setQueryData(['todos'], updaterFn, namedOptions)

  return <div>Example Component</div>
}

export const ExamplesWithSetQueryDefaultsMethodCall = () => {
  const namedQueryFn = () => 1
  const namedOptions = { queryFn: () => 1, cacheTime: 1000 }
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.setQueryDefaults(['todos'], { queryFn: async () => null })
  queryClient.setQueryDefaults(['todos'], { queryFn: namedQueryFn })
  queryClient.setQueryDefaults(['todos'], namedOptions)
  queryClient.setQueryDefaults(['todos'], { queryFn: async () => null })
  queryClient.setQueryDefaults(['todos'], { queryFn: namedQueryFn })
  queryClient.setQueryDefaults(['todos'], namedOptions)
  // Direct hook call.
  RQ.useQueryClient().setQueryDefaults(['todos'], {
    queryFn: async () => null,
  })
  RQ.useQueryClient().setQueryDefaults(['todos'], { queryFn: namedQueryFn })
  RQ.useQueryClient().setQueryDefaults(['todos'], namedOptions)
  RQ.useQueryClient().setQueryDefaults(['todos'], {
    queryFn: async () => null,
  })
  RQ.useQueryClient().setQueryDefaults(['todos'], { queryFn: namedQueryFn })
  RQ.useQueryClient().setQueryDefaults(['todos'], namedOptions)

  return <div>Example Component</div>
}
