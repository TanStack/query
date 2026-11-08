import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import {
  infiniteQueryOptions,
  mutationOptions,
  queryOptions,
} from '../../src/core/index.js'
import type {
  CreateMutationResult,
  CreateQueryResult,
  DefinedCreateQueryResult,
  QueriesResults,
} from '../../src/core/index.js'

describe('type definitions', () => {
  it('results stay discriminated unions', () => {
    const result = {} as CreateQueryResult<Array<string>, Error>
    if (result.status === 'success')
      expectTypeOf(result.data).toEqualTypeOf<Array<string>>()
    if (result.isError) expectTypeOf(result.error).toEqualTypeOf<Error>()
    expectTypeOf(result.refetch).returns.resolves.toMatchTypeOf<{
      data: Array<string> | undefined
    }>()

    const defined = {} as DefinedCreateQueryResult<number>
    expectTypeOf(defined.data).toEqualTypeOf<number>()
  })

  it('queryOptions tags the key', () => {
    const options = queryOptions({ queryKey: ['todos'], queryFn: () => [1, 2] })
    const client = new QueryClient()
    expectTypeOf(client.getQueryData(options.queryKey)).toEqualTypeOf<
      Array<number> | undefined
    >()

    const withInitial = queryOptions({
      queryKey: ['n'],
      queryFn: () => 1,
      initialData: 0,
    })
    expectTypeOf(withInitial.initialData).not.toBeUndefined()
  })

  it('infiniteQueryOptions tags the key with InfiniteData', () => {
    const options = infiniteQueryOptions({
      queryKey: ['feed'],
      queryFn: ({ pageParam }) => ({ items: [pageParam] }),
      initialPageParam: 0,
      getNextPageParam: () => 1,
    })
    const data = new QueryClient().getQueryData(options.queryKey)
    expectTypeOf(data?.pages).toEqualTypeOf<
      Array<{ items: Array<number> }> | undefined
    >()
  })

  it('mutationOptions keeps types and mutation results narrow', () => {
    const options = mutationOptions({
      mutationKey: ['add'],
      mutationFn: (title: string) => Promise.resolve({ id: 1, title }),
    })
    expectTypeOf(options.mutationKey).toEqualTypeOf<ReadonlyArray<unknown>>()
    const result = {} as CreateMutationResult<{ id: number }, Error, string>
    expectTypeOf(result.mutate).parameter(0).toEqualTypeOf<string>()
    if (result.isSuccess)
      expectTypeOf(result.data).toEqualTypeOf<{ id: number }>()
  })

  it('queriesResults maps each entry', () => {
    type Results = QueriesResults<
      [
        { queryKey: ['a']; queryFn: () => number },
        { queryKey: ['b']; queryFn: () => string },
      ]
    >
    expectTypeOf<Results[0]['data']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<Results[1]['data']>().toEqualTypeOf<string | undefined>()
  })
})
