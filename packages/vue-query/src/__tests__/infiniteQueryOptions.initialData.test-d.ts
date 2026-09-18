import { describe, expectTypeOf, it } from 'vitest'
import { dataTagSymbol } from '@tanstack/query-core'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import { useInfiniteQuery } from '../useInfiniteQuery'
import type { InfiniteData } from '@tanstack/query-core'
import type { DefinedInitialDataInfiniteOptions } from '../infiniteQueryOptions'

const queryOptions = {
  queryKey: ['initial-data'],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    Promise.resolve(`${pageParam}`),
  initialPageParam: 0,
  getNextPageParam: () => 1,
}

describe('infiniteQueryOptions initialData', () => {
  it('accepts data that may be undefined without losing page inference', () => {
    const createOptions = (initialData?: InfiniteData<string, number>) =>
      infiniteQueryOptions({ ...queryOptions, initialData })

    const options = createOptions()
    const { data } = useInfiniteQuery(options)

    expectTypeOf(data.value).toEqualTypeOf<InfiniteData<string> | undefined>()
    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<
      InfiniteData<string>
    >()
  })

  it('accepts an initializer that may return undefined', () => {
    const createOptions = (initialData?: InfiniteData<string, number>) =>
      infiniteQueryOptions({
        ...queryOptions,
        initialData: () => initialData,
      })

    const { data } = useInfiniteQuery(createOptions())

    expectTypeOf(data.value).toEqualTypeOf<InfiniteData<string> | undefined>()
  })

  it('preserves select inference when initial data is optional', () => {
    const createOptions = (initialData?: InfiniteData<string, number>) =>
      infiniteQueryOptions({
        ...queryOptions,
        initialData,
        select: (data) => {
          expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
          return data.pages.length
        },
      })

    const { data } = useInfiniteQuery(createOptions())

    expectTypeOf(data.value).toEqualTypeOf<number | undefined>()
  })

  it('keeps the defined overload for a guaranteed initial value', () => {
    const options = infiniteQueryOptions({
      ...queryOptions,
      initialData: { pages: ['first'], pageParams: [0] },
    })

    expectTypeOf(options).toExtend<
      DefinedInitialDataInfiniteOptions<
        string,
        Error,
        InfiniteData<string>,
        Array<string>,
        number
      >
    >()
  })

  it('keeps the defined overload for a guaranteed initializer', () => {
    const options = infiniteQueryOptions({
      ...queryOptions,
      initialData: () => ({ pages: ['first'], pageParams: [0] }),
    })

    expectTypeOf(options).toExtend<
      DefinedInitialDataInfiniteOptions<
        string,
        Error,
        InfiniteData<string>,
        Array<string>,
        number
      >
    >()
  })

  it('still accepts missing and explicitly undefined initial data', () => {
    const absent = infiniteQueryOptions(queryOptions)
    const explicit = infiniteQueryOptions({
      ...queryOptions,
      initialData: undefined,
    })

    expectTypeOf(useInfiniteQuery(absent).data.value).toEqualTypeOf<
      InfiniteData<string> | undefined
    >()
    expectTypeOf(useInfiniteQuery(explicit).data.value).toEqualTypeOf<
      InfiniteData<string> | undefined
    >()
  })
})
