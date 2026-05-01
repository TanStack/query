import { assertType, describe, expectTypeOf, it } from 'vitest'
import { computed, reactive, ref } from 'vue-demi'
import { dataTagSymbol } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient } from '../queryClient'
import { queryOptions } from '../queryOptions'
import { useQuery } from '../useQuery'

describe('queryOptions', () => {
  it('should not allow excess properties', () => {
    const key = queryKey()
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
    const key = queryKey()
    queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
      staleTime: 1000,
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })
  it('should work when passed to useQuery', () => {
    const key = queryKey()
    const options = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const { data } = reactive(useQuery(options))
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
  it('should tag the queryKey with the result type of the QueryFn', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<number>()
  })
  it('should tag the queryKey even if no promise is returned', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => 5,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<number>()
  })
  it('should tag the queryKey with unknown if there is no queryFn', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<unknown>()
  })
  it('should tag the queryKey with the result type of the QueryFn if select is used', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<number>()
  })
  it('should return the proper type when passed to getQueryData', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(tagged)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
  it('should properly type updaterFn when passed to setQueryData', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(tagged, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<number | undefined>()
      return prev
    })
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
  it('should properly type value when passed to setQueryData', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()

    // @ts-expect-error value should be a number
    queryClient.setQueryData(tagged, '5')
    // @ts-expect-error value should be a number
    queryClient.setQueryData(tagged, () => '5')

    const data = queryClient.setQueryData(tagged, 5)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
  it('should allow to be passed to QueryClient methods while containing getter', () => {
    const ref1 = ref(1)
    const ref2 = ref(2)
    const options = queryOptions(() => ({
      queryKey: [...queryKey(), ref1.value, { nested: ref2.value }],
      queryFn: () => Promise.resolve(5),
    }))

    const queryClient = new QueryClient()

    // Should not error
    const data = queryClient.invalidateQueries(options)
    // Should not error
    const data2 = queryClient.fetchQuery(options)

    expectTypeOf(data).toEqualTypeOf<Promise<void>>()
    expectTypeOf(data2).toEqualTypeOf<Promise<number>>()
  })

  it('TData should always be defined when initialData is provided as a function which ALWAYS returns the data', () => {
    const key = queryKey()
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

  it('TData should have undefined in the union when initialData is NOT provided', () => {
    const key = queryKey()
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

  it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
    const key = queryKey()
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

  it('TData should be narrowed after an isSuccess check when initialData is provided as a function which can return undefined', () => {
    const key = queryKey()
    const { data, isSuccess } = reactive(
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

    if (isSuccess) {
      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    }
  })

  it('data should not have undefined when initialData is provided', () => {
    const key = queryKey()
    const { data } = reactive(
      useQuery(
        queryOptions({
          queryKey: key,
          initialData: 42,
        }),
      ),
    )

    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should allow accessing queryFn and other properties on the returned options object', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve([]),
    })

    expectTypeOf(options.queryFn).not.toBeUndefined()
    expectTypeOf(options.queryKey).not.toBeUndefined()
    expectTypeOf(options.staleTime).not.toBeUndefined()
  })

  it('should allow accessing queryFn and other properties on the returned options when used with getter', () => {
    const options = queryOptions(() => ({
      queryKey: queryKey(),
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
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(1),
      enabled,
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()
  })

  it('should allow ref as enabled property', () => {
    const enabled = ref(true)

    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(1),
      enabled,
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()
  })

  it('should allow boolean as enabled property', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(1),
      enabled: true,
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()
  })

  it('should allow getter function as enabled property', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(1),
      enabled: () => true,
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()
  })

  it('should work with branded queryKey', () => {
    type PostId = string & { readonly __brand: 'PostId' }
    const postId = '123' as PostId

    const options = queryOptions({
      queryKey: ['post', postId],
      queryFn: () => Promise.resolve({ id: postId }),
    })

    expectTypeOf(options.queryKey).not.toBeUndefined()

    // This should not error - the branded queryKey should be accepted by useQuery
    const { data } = reactive(useQuery(options))
    expectTypeOf(data).toEqualTypeOf<{ id: PostId } | undefined>()
  })

  it('should work with branded queryKey inside MaybeRefOrGetter', () => {
    type PostId = string & { readonly __brand: 'PostId' }
    const postId = '123' as PostId

    // Test 1: simple queryOptions with branded string directly in tuple (like existing test)
    const simpleOptions = queryOptions({
      queryKey: ['post', postId as PostId],
      queryFn: () => Promise.resolve({ id: postId as PostId }),
    })
    const { data: simpleData } = reactive(useQuery(simpleOptions))
    expectTypeOf(simpleData).toEqualTypeOf<{ id: PostId } | undefined>()

    // Test 2: branded string inside object inside tuple
    const nestedOptions = queryOptions({
      queryKey: ['post', { postId: postId as PostId }],
      queryFn: () => Promise.resolve({ id: postId as PostId }),
    })
    const { data: nestedData } = reactive(useQuery(nestedOptions))
    expectTypeOf(nestedData).toEqualTypeOf<{ id: PostId } | undefined>()

    // Test 3: inline branded queryKey
    const { data: inlineData } = reactive(
      useQuery({
        queryKey: ['post', { postId: postId as PostId }],
        queryFn: () => Promise.resolve({ id: postId as PostId }),
      }),
    )
    expectTypeOf(inlineData).toEqualTypeOf<{ id: PostId } | undefined>()
  })
})
