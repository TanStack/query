import * as React from 'react'
import * as RQ from 'react-query'

export const Examples = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.getMutationDefaults(['todos'])
  queryClient.getQueriesData(['todos'])
  queryClient.getQueryData(['todos'])
  queryClient.getQueryDefaults(['todos'])
  queryClient.getQueryState(['todos'])
  queryClient.isFetching(['todos'])
  queryClient.setMutationDefaults(['todos'], { mutationFn: async () => null })
  queryClient.setQueriesData(['todos'], () => null)
  queryClient.setQueryData(['todos'], () => null)
  queryClient.setQueryDefaults(['todos'], { queryFn: async () => null })
  // Direct hook call.
  RQ.useQueryClient().getMutationDefaults(['todos'])
  RQ.useQueryClient().getQueriesData(['todos'])
  RQ.useQueryClient().getQueryData(['todos'])
  RQ.useQueryClient().getQueryDefaults(['todos'])
  RQ.useQueryClient().getQueryState(['todos'])
  RQ.useQueryClient().isFetching(['todos'])
  RQ.useQueryClient().setMutationDefaults(['todos'], {
    mutationFn: async () => null,
  })
  RQ.useQueryClient().setQueriesData(['todos'], () => null)
  RQ.useQueryClient().setQueryData(['todos'], () => null)
  RQ.useQueryClient().setQueryDefaults(['todos'], {
    queryFn: async () => null,
  })

  return <div>Example Component</div>
}
