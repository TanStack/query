import { $, component$ } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import { QueryClient } from '@tanstack/query-core'
import {
  createQueryClient,
  queryClientState,
  useIsFetching,
  useMutation,
  useQuery,
} from '@tanstack/qwik-query'

export const queryFunction = $(async () => {
  const limit = Math.random() > 0.5 ? 100 : 20
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`)
  const json = await res.json()
  return json.results.map((pokemon: any) => ({ name: pokemon.name }))
})

const queryKey = ['post'] as const

export const useRouteLoader = routeLoader$(async () => {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: $(async () => queryFunction()),
  })
  return queryClientState(queryClient)
})

export default component$(() => {
  const queryStore = useQuery(
    {
      queryKey,
      queryFn: queryFunction,
      refetchInterval: 1000,
    },
    useRouteLoader().value,
  )
  const isFetchingSig = useIsFetching()
  const mutationStore = useMutation({
    mutationFn: $(() => fetch(`/api/data?clear=1`)),
    onSuccess: $(() => {
      const queryClient = createQueryClient()
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }),
    onError: $(() => {
      console.log('-----error----')
      const queryClient = createQueryClient()
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }),
  })
  return (
    <div>
      <button
        onClick$={() => {
          queryStore.options = { ...queryStore.options, refetchInterval: 5000 }
        }}
      >
        change refetchInterval
      </button>
      <button
        onClick$={() => {
          // mutationStore.options = {
          // 	...mutationStore.options,
          // 	onError: $(() => { }),
          // };
          // mutationStore.mutate();
        }}
      >
        mutation
      </button>
      <h3>isFetch: {isFetchingSig.value}</h3>
      <h3>Data: {queryStore.result.data?.length}</h3>
      <h3>Status: {queryStore.result.status}</h3>
      {(queryStore.result.data || []).map((pokemon: any, key: number) => (
        <div key={key}>{pokemon.name}</div>
      ))}
    </div>
  )
})
