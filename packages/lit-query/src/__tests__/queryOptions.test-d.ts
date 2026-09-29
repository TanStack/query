import { QueryClient, dataTagSymbol } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { describe, expectTypeOf, it } from 'vitest'
import { createQueryController } from '../createQueryController.js'
import { queryOptions } from '../queryOptions.js'

class Host extends LitElement {}

describe('queryOptions', () => {
  it('should work when passed to createQueryController', () => {
    const query = createQueryController(
      new Host(),
      queryOptions({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ id: 1, name: 'Ada' }),
      }),
      new QueryClient(),
    )

    expectTypeOf(query().data).toEqualTypeOf<
      { id: number; name: string } | undefined
    >()
  })

  it('should work when passed to query', async () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should work when passed to query with select', async () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<string>()
  })

  it('should work when passed to query with enabled: false', async () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      enabled: false,
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should tag the queryKey with the result type of the QueryFn', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve({ id: 2, name: 'Grace' }),
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<{
      id: number
      name: string
    }>()
  })

  it('should return the proper type when passed to getQueryData', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve({ id: 2, name: 'Grace' }),
    })

    const data = new QueryClient().getQueryData(tagged)
    expectTypeOf(data).toEqualTypeOf<{ id: number; name: string } | undefined>()
  })

  it('should properly type value when passed to setQueryData', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve({ id: 2, name: 'Grace' }),
    })

    const data = new QueryClient().setQueryData(tagged, {
      id: 3,
      name: 'Lin',
    })
    expectTypeOf(data).toEqualTypeOf<{ id: number; name: string } | undefined>()
  })
})
