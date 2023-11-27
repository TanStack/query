import { $, component$, useSignal } from '@builder.io/qwik'
import { useIsFetching } from '../useIsFetching'
import { useQuery } from '../useQuery'
import { sleep } from './utils'

export const UseIsFetchingTest1 = component$(() => {
  const isFetching = useIsFetching()
  const storeQuery = useQuery({
    queryKey: ['query_1'],
    queryFn: $(async () => {
      await sleep(50)
      return 'test'
    }),
    enabled: false,
  })

  return (
    <>
      <div>isFetching: {isFetching}</div>
      <button
        onClick$={() =>
          (storeQuery.options = { ...storeQuery.options, enabled: true })
        }
      >
        Enable Query
      </button>
    </>
  )
})

const Query1 = component$(() => {
  useQuery({
    queryKey: ['query_2'],
    queryFn: $(async () => {
      await sleep(30)
      return 'test'
    }),
  })
  return null
})

const Query2 = component$(() => {
  useQuery({
    queryKey: ['query_3'],
    queryFn: $(async () => {
      await sleep(30)
      return 'test'
    }),
  })
  return null
})

export const UseIsFetchingTest2 = component$(() => {
  const isFetching = useIsFetching({ queryKey: ['query_2'] })
  const showQueriesSig = useSignal(false)
  return (
    <>
      <button onClick$={() => (showQueriesSig.value = true)}>show</button>
      <div>isFetching: {isFetching}</div>
      {showQueriesSig.value && (
        <>
          <Query1 />
          <Query2 />
        </>
      )}
    </>
  )
})

export const UseIsFetchingTest3 = component$(() => {
  useQuery({
    queryKey: ['query_4'],
    queryFn: $(async () => {
      await sleep(30)
      return 'test'
    }),
  })
  const isFetching = useIsFetching()

  return <div>isFetching: {isFetching}</div>
})
