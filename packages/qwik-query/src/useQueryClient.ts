import { isServer } from '@builder.io/qwik/build'
import { DehydratedState, QueryClient, hydrate } from '@tanstack/query-core'

let queryClient: QueryClient | null = null

export const createQueryClient = (dehydratedData?: DehydratedState) => {
  if (isServer) {
    throw 'You can use getQueryClient only it the client side!'
  }

  if (queryClient && !dehydratedData) {
    return queryClient
  }

  queryClient = new QueryClient()
  if (dehydratedData) {
    hydrate(queryClient, dehydratedData)
  }

  queryClient.mount()
  return queryClient
}
