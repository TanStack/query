import {
  dataTagSymbol,
  isSuccess,
  select,
  skipToken,
} from '@tanstack/query-core'
import { createKey } from '@tanstack/query-test-utils'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { computed, reactive, ref } from 'vue'
import { defaultQueryFn } from '..'
import {
  QueryClient,
  getQueryData,
  getQueryState,
  invalidateQueries,
  query as queryQuery,
  setQueryData,
} from '../queryClient'
import { queryOptions } from '../queryOptions'
import { useQueries } from '../useQueries'
import { useQuery } from '../useQuery'
import type { InitialDataFunction } from '@tanstack/query-core'

// Regression test for exported queryOptions inference under declaration emit.
// TypeScript should be able to name the return type without expanding the
// internal data tag symbols into the consumer's .d.ts output.
export const exportedQueryOptions = queryOptions({
  queryKey: ['invalid'],
  queryFn: defaultQueryFn,
})

export const exportedQueryOptionsGetter = queryOptions(() => ({
  queryKey: ['invalid'],
  queryFn: defaultQueryFn,
}))

describe('queryOptions', () => {
  it('should not allow excess properties', () => {
    const key = createKey()
    assertType(
      queryOptions({
        // @ts-expect-error this is a good error, because stallTime does not exist!
        queryKey: key,
        queryFn: () => Promise.resolve(5),
        stallTime: 1000,
      }),
    )
  })

  it('should infer types for callbacks', () => {
    const key = createKey()
    queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
      staleTime: 1000,
      select: [
        select,
        (data) => {
          expectTypeOf(data).toEqualTypeOf<number>()
        },
      ],
    })
  })

  it('should work when passed to useQuery', () => {
    const key = createKey()
    const options = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const { data } = reactive(useQuery(options))
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should work when passed to useQueries', () => {
    const options = queryOptions({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
    })

    const { value: queriesState } = useQueries({ queries: [options] })

    expectTypeOf(queriesState[0].data).toEqualTypeOf<number | undefined>()
  })

  it('should work when passed to query', async () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    const data = await queryQuery(new QueryClient(), options)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should work when passed to query with select', async () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      select: [select, (data) => data.toString()],
    })

    const data = await queryQuery(new QueryClient(), options)
    expectTypeOf(data).toEqualTypeOf<string | undefined>()
  })

  it('should work when passed to query with enabled: false', async () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      enabled: false,
    })

    const data = await queryQuery(new QueryClient(), options)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should work when passed to query with skipToken', async () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: skipToken,
    })

    const data = await queryQuery(new QueryClient(), options)
    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should tag the queryKey with the result type of the QueryFn', () => {
    const key = createKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<number>()
  })

  it('should tag the queryKey even if no promise is returned', () => {
    const key = createKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => 5,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<number>()
  })

  it('should tag the queryKey with unknown when using defaultQueryFn', () => {
    const key = createKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: defaultQueryFn,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<unknown>()
  })

  it('should tag the queryKey with the result type of the QueryFn if select is used', () => {
    const key = createKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
      select: [select, (data) => data.toString()],
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<number>()
  })

  it('should return the proper type when passed to getQueryData', () => {
    const key = createKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = getQueryData(queryClient, tagged)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should return the proper type when passed to getQueryState', () => {
    const key = createKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const state = getQueryState(queryClient, tagged)

    expectTypeOf(state?.data).toEqualTypeOf<number | undefined>()
  })

  it('should properly type updaterFn when passed to setQueryData', () => {
    const key = createKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = setQueryData(queryClient, tagged, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<number | undefined>()
      return prev
    })
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should preserve discriminated union narrowing in setQueryData updaterFn', () => {
    type Data =
      | { kind: 'a'; value: number; requiredA: number }
      | { kind: 'b'; value: number; requiredB: number }

    const key = createKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: (): Promise<Data> =>
        Promise.resolve({
          kind: 'a',
          value: 1,
          requiredA: 1,
        }),
    })

    const queryClient = new QueryClient()
    setQueryData(queryClient, tagged, (prev) => {
      if (!prev || prev.kind !== 'a') {
        return prev
      }

      expectTypeOf(prev).toEqualTypeOf<Extract<Data, { kind: 'a' }>>()
      return { ...prev, value: prev.value + 1 }
    })

    // @ts-expect-error updater input should be inferred from the tagged query key
    setQueryData(queryClient, tagged, (prev: string | undefined) => prev)
  })

  it('should properly type value when passed to setQueryData', () => {
    const key = createKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()

    // @ts-expect-error value should be a number
    setQueryData(queryClient, tagged, '5')
    // @ts-expect-error value should be a number
    setQueryData(queryClient, tagged, () => '5')

    const data = setQueryData(queryClient, tagged, 5)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer even if there is a conditional skipToken', () => {
    const key = createKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = getQueryData(queryClient, tagged)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer to unknown if we disable a query with just a skipToken', () => {
    const key = createKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: skipToken,
    })

    const queryClient = new QueryClient()
    const data = getQueryData(queryClient, tagged)

    expectTypeOf(data).toEqualTypeOf<unknown>()
    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<unknown>()
  })

  it('should support using getter options with imperative methods', () => {
    const ref1 = ref(1)
    const ref2 = ref(2)
    const options = queryOptions(() => ({
      queryKey: [...createKey(), ref1.value, { nested: ref2.value }],
      queryFn: () => Promise.resolve(5),
    }))

    const queryClient = new QueryClient()

    const data = invalidateQueries(queryClient, options)
    const data2 = queryQuery(queryClient, options())

    expectTypeOf(data).toEqualTypeOf<Promise<void>>()
    expectTypeOf(data2).toEqualTypeOf<Promise<number | undefined>>()
  })

  it('should always define TData when initialData is provided as a function which ALWAYS returns the data', () => {
    const key = createKey()
    const { data } = reactive(
      useQuery(
        queryOptions({
          queryKey: key,
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => ({
            wow: true,
          }),
        }),
      ),
    )

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
  })

  it('should have undefined in the TData union when initialData is NOT provided', () => {
    const key = createKey()
    const { data } = reactive(
      useQuery(
        queryOptions({
          queryKey: key,
          queryFn: () => {
            return {
              wow: true,
            }
          },
        }),
      ),
    )

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
  })

  it('should have undefined in the TData union when initialData is provided as a function which can return undefined', () => {
    const key = createKey()
    const { data } = reactive(
      useQuery(
        queryOptions({
          queryKey: key,
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        }),
      ),
    )

    expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
  })

  it('should narrow TData after an isSuccess check when initialData is provided as a function which can return undefined', () => {
    const key = createKey()
    const result = reactive(
      useQuery(
        queryOptions({
          queryKey: key,
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        }),
      ),
    )

    if (isSuccess(result)) {
      expectTypeOf(result.data).toEqualTypeOf<{ wow: boolean }>()
    }
  })

  it('should not have undefined in data when initialData is provided', () => {
    const key = createKey()
    const { data } = reactive(
      useQuery(
        queryOptions({
          queryKey: key,
          queryFn: defaultQueryFn,
          initialData: 42,
        }),
      ),
    )

    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should allow optional initialData object', () => {
    const options = queryOptions({
      queryKey: createKey(),
      queryFn: () => Promise.resolve('something string'),
      initialData: Math.random() > 0.5 ? 'initial string' : undefined,
    })

    expectTypeOf(options.initialData).toExtend<
      InitialDataFunction<string> | string | undefined
    >()
  })

  it('should allow undefined response in initialData', () => {
    assertType((id: string | null) =>
      queryOptions({
        queryKey: [...createKey(), id],
        queryFn: () =>
          Promise.resolve({
            id: '1',
            title: 'Do Laundry',
          }),
        initialData: () =>
          !id
            ? undefined
            : {
                id,
                title: 'Initial Data',
              },
      }),
    )
  })

  it('should allow accessing queryFn and other properties on the returned options object', () => {
    const options = queryOptions({
      queryKey: createKey(),
      queryFn: () => Promise.resolve([]),
    })

    expectTypeOf(options.queryFn).not.toBeUndefined()
    expectTypeOf(options.queryKey).not.toBeUndefined()
    expectTypeOf(options.staleTime).not.toBeUndefined()
  })

  it('should allow accessing queryFn and other properties on the returned options when used with getter', () => {
    const options = queryOptions(() => ({
      queryKey: createKey(),
      queryFn: () => Promise.resolve([]),
    }))

    const resolvedGetter = options()

    expectTypeOf(resolvedGetter.queryFn).not.toBeUndefined()
    expectTypeOf(resolvedGetter.queryKey).not.toBeUndefined()
  })

  it('should allow computed ref as enabled property', () => {
    const enabled = computed(() => true)

    // This was broken in #10452, fixed in #10458
    const options = queryOptions({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(1),
      enabled,
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()
  })

  it('should allow ref as enabled property', () => {
    const enabled = ref(true)

    const options = queryOptions({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(1),
      enabled,
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()
  })

  it('should allow boolean as enabled property', () => {
    const options = queryOptions({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(1),
      enabled: true,
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()
  })

  it('should allow getter function as enabled property', () => {
    const options = queryOptions({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(1),
      enabled: () => true,
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()
  })

  it('should allow a getter that returns boolean or undefined', () => {
    const someRef = ref<boolean | undefined>(false)

    const options = queryOptions({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(1),
      enabled: () => someRef.value,
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()
  })

  it('should type enabled with the query argument from query-core', () => {
    queryOptions({
      queryKey: ['post'] as const,
      queryFn: () => Promise.resolve(1),
      enabled: (query) => {
        expectTypeOf(query.queryKey).toEqualTypeOf<readonly ['post']>()
        return query.state.status !== 'pending'
      },
    })
  })

  it('should allow computed ref as queryKey', () => {
    const id = ref<string | null>('1')

    // This was broken in #10452, the #10465 fix only covered `enabled`
    const options = queryOptions({
      queryKey: computed(() => ['foo', id.value] as const),
      queryFn: () => Promise.resolve({ id: '1' }),
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()
  })

  it('should allow ref as queryKey', () => {
    const keyRef = ref(['foo', '1'] as const)

    const options = queryOptions({
      queryKey: keyRef,
      queryFn: () => Promise.resolve({ id: '1' }),
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()
  })

  it('should allow getter function as queryKey', () => {
    const id = ref<string | null>('1')

    const options = queryOptions({
      queryKey: () => ['foo', id.value] as const,
      queryFn: () => Promise.resolve({ id: '1' }),
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()
  })

  it('should allow computed queryFn resolving to skipToken', () => {
    const id = ref<string | null>('1')

    const options = queryOptions({
      queryKey: computed(() => ['foo', id.value]),
      queryFn: computed(() =>
        id.value ? () => Promise.resolve({ id: '1' }) : skipToken,
      ),
    })

    const { data } = reactive(useQuery(options))

    expectTypeOf(data).toEqualTypeOf<{ id: string } | undefined>()
  })

  it('should allow skipToken inside a whole-options getter', () => {
    const id = ref<string | null>('1')

    const options = queryOptions(() => {
      const current = id.value
      return {
        queryKey: ['foo', current],
        queryFn: current ? () => Promise.resolve({ id: current }) : skipToken,
      }
    })

    const { data } = reactive(useQuery(options))

    expectTypeOf(data).toEqualTypeOf<{ id: string } | undefined>()
  })
})
