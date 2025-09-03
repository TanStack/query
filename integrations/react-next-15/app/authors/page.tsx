import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { makeQueryClient } from '../make-query-client'
import { getApiV1AuthorsOptions } from '../query'
import { Authors } from '../client-component'

export default async function Page() {
  const queryClient = makeQueryClient()

  const data = await queryClient.fetchQuery({ ...getApiV1AuthorsOptions() })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Authors />
    </HydrationBoundary>
  )
}
