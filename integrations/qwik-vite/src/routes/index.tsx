import { $, component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import { QueryClient } from '@tanstack/query-core'
import {
  queryClientState,
  useIsFetching,
  useQuery
} from '@tanstack/qwik-query'

export const queryFunction = $(async () => 'Success')

export const useRouteLoader = routeLoader$(async () => {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['test'],
    queryFn: $(async () => queryFunction()),
  })
  return queryClientState(queryClient)
})

export default component$(() => {
  const queryStore = useQuery(
    { queryKey: ['test'], queryFn: queryFunction },
    useRouteLoader().value,
  )
  const isFetchingSig = useIsFetching()
  return (
    <>
      {isFetchingSig.value ? 'Loading...' : queryStore.value}
    </>
  )
})
