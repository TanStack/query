import { assertType, describe, expectTypeOf, it } from 'vitest'
import { computed, reactive, ref } from 'vue-demi'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { queryOptions, skipToken, useQuery } from '..'
import type { Ref } from 'vue-demi'
import type { OmitKeyof, UseQueryOptions, UseQueryReturnType } from '..'

describe('useQuery', () => {
  describe('Config object overload', () => {
    it('should always define TData when initialData is provided as an object', () => {
      const key = createKey()

      const { data } = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: {
            wow: true,
          },
        }),
      )

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('should define TData when passed through queryOptions', () => {
      const key = createKey()

      const options = queryOptions({
        queryKey: key,
        queryFn: () => {
          return {
            wow: true,
          }
        },
        initialData: {
          wow: true,
        },
      })
      const { data } = reactive(useQuery(options))

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQuery', () => {
      const key = createKey()

      const options = queryOptions({
        queryKey: key,
        queryFn: () => Promise.resolve(1),
      })

      const query = reactive(
        useQuery({
          ...options,
          select: (data) => data > 1,
        }),
      )

      expectTypeOf(query.data).toEqualTypeOf<boolean | undefined>()
    })

    it('should always define TData when initialData is provided as a function which ALWAYS returns the data', () => {
      const key = createKey()

      const { data } = reactive(
        useQuery({
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
      )

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
    })

    it('should have undefined in the TData union when initialData is NOT provided', () => {
      const key = createKey()

      const { data } = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => {
            return {
              wow: true,
            }
          },
        }),
      )

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })

    it('should have undefined in the TData union when initialData is provided as a function which can return undefined', () => {
      const key = createKey()

      const { data } = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        }),
      )

      expectTypeOf(data).toEqualTypeOf<{ wow: boolean } | undefined>()
    })

    it('should narrow TData after an isSuccess check when initialData is provided as a function which can return undefined', () => {
      const key = createKey()

      const { data, isSuccess } = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        }),
      )

      if (isSuccess) {
        expectTypeOf(data).toEqualTypeOf<{ wow: boolean }>()
      }
    })

    it('should not have undefined in data when initialData is provided', () => {
      const key = createKey()

      const { data } = reactive(
        useQuery({
          queryKey: key,
          initialData: 42,
        }),
      )

      expectTypeOf(data).toEqualTypeOf<number>()
    })
  })

  describe('generic queryFn', () => {
    it('should infer the result type from a generic query function', () => {
      const key = createKey()

      function queryFn<T = string>(): Promise<T> {
        return Promise.resolve({} as T)
      }

      const query = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => queryFn(),
        }),
      )

      expectTypeOf(query.data).toEqualTypeOf<string | undefined>()
      expectTypeOf(query.error).toEqualTypeOf<Error | null>()
    })
  })

  describe('generic queryKey inference (#8199)', () => {
    it('should not error when wrapping useQuery in a composable that propagates a generic type to the queryKey', () => {
      const basket = { fruit: 'apple', vegetable: 'broccoli' } as const

      function getBasket<T extends 'fruit' | 'vegetable'>(type: T) {
        return basket[type]
      }

      function useBasket<T extends 'fruit' | 'vegetable'>(type: T) {
        return useQuery({
          queryKey: ['basket', type] as const,
          queryFn({ queryKey: [, t] }) {
            return getBasket(t)
          },
        })
      }

      assertType<UseQueryReturnType<'apple' | 'broccoli', Error>>(
        useBasket('fruit'),
      )
    })
  })

  describe('custom composable', () => {
    it('should allow custom composable using UseQueryOptions', () => {
      const key = createKey()

      const useCustomQuery = (
        options?: OmitKeyof<
          UseQueryOptions<string>,
          'queryKey' | 'queryFn',
          'safely'
        >,
      ) => {
        return useQuery({
          ...options,
          queryKey: key,
          queryFn: () => Promise.resolve('data'),
        })
      }

      const { data } = reactive(useCustomQuery())

      expectTypeOf(data).toEqualTypeOf<string | undefined>()
    })
  })

  describe('structuralSharing', () => {
    it('should be able to use structuralSharing with unknown types', () => {
      const key = createKey()

      // https://github.com/TanStack/query/issues/6525#issuecomment-1938411343
      useQuery({
        queryKey: key,
        queryFn: () => 5,
        structuralSharing: (oldData, newData) => {
          expectTypeOf(oldData).toBeUnknown()
          expectTypeOf(newData).toBeUnknown()
          return newData
        },
      })
    })
  })

  describe('state', () => {
    it('should read data and isPending without unwrapping refs', () => {
      const key = createKey()

      const { state } = useQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      })

      expectTypeOf(state.status).toEqualTypeOf<
        'pending' | 'error' | 'success'
      >()
      expectTypeOf(state.isPending).toEqualTypeOf<boolean>()
      expectTypeOf(state.data).toEqualTypeOf<string | undefined>()
      expectTypeOf(state.refetch).toBeFunction()
    })

    it('should narrow data to TData when status is success', () => {
      const key = createKey()

      const { state } = useQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      })

      if (state.status === 'success') {
        expectTypeOf(state.data).toEqualTypeOf<string>()
        expectTypeOf(state.error).toEqualTypeOf<null>()
        expectTypeOf(state.isPending).toEqualTypeOf<false>()
        expectTypeOf(state.isSuccess).toEqualTypeOf<true>()
      }
    })

    it('should narrow data to TData when isSuccess is true', () => {
      const key = createKey()

      const { state } = useQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      })

      if (state.isSuccess) {
        expectTypeOf(state.data).toEqualTypeOf<string>()
        expectTypeOf(state.error).toEqualTypeOf<null>()
      }
    })

    it('should narrow data to undefined when status is pending', () => {
      const key = createKey()

      const { state } = useQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      })

      if (state.status === 'pending') {
        expectTypeOf(state.data).toEqualTypeOf<undefined>()
        expectTypeOf(state.error).toEqualTypeOf<null>()
        expectTypeOf(state.isPending).toEqualTypeOf<true>()
      }

      if (state.isPending) {
        expectTypeOf(state.data).toEqualTypeOf<undefined>()
      }
    })

    it('should narrow error when status is error and keep data possibly undefined', () => {
      const key = createKey()

      const { state } = useQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      })

      if (state.status === 'error') {
        expectTypeOf(state.error).toEqualTypeOf<Error>()
        expectTypeOf(state.data).toEqualTypeOf<string | undefined>()
        expectTypeOf(state.isPending).toEqualTypeOf<false>()
      }
    })

    it('should keep data defined on state when initialData is provided', () => {
      const key = createKey()

      const { state } = useQuery({
        queryKey: key,
        queryFn: () => ({ wow: true }),
        initialData: { wow: true },
      })

      expectTypeOf(state.data).toEqualTypeOf<{ wow: boolean }>()

      if (state.status === 'success') {
        expectTypeOf(state.data).toEqualTypeOf<{ wow: boolean }>()
      }
    })

    it('should keep a function returned by select as data', () => {
      const key = createKey()

      const { state } = useQuery({
        queryKey: key,
        queryFn: () => 'fetched',
        initialData: 'initial',
        select: (value: string) => () => value,
      })

      if (state.status === 'success') {
        expectTypeOf(state.data).toEqualTypeOf<() => string>()
      }
    })
  })

  describe('Discriminated union return type', () => {
    it('should have possibly undefined data by default', () => {
      const key = createKey()

      const query = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
      )

      expectTypeOf(query.data).toEqualTypeOf<string | undefined>()
    })

    it('should have defined data when query is success', () => {
      const key = createKey()

      const query = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
      )

      if (query.isSuccess) {
        expectTypeOf(query.data).toEqualTypeOf<string>()
      }
    })

    it('should have null error when query is success', () => {
      const key = createKey()

      const query = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
      )

      if (query.isSuccess) {
        expectTypeOf(query.error).toEqualTypeOf<null>()
      }
    })

    it('should have undefined data when query is pending', () => {
      const key = createKey()

      const query = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
      )

      if (query.isPending) {
        expectTypeOf(query.data).toEqualTypeOf<undefined>()
      }
    })

    it('should have defined error when query is error', () => {
      const key = createKey()

      const query = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
      )

      if (query.isError) {
        expectTypeOf(query.error).toEqualTypeOf<Error>()
      }
    })

    it('should have data as a union of refs without reactive()', () => {
      const key = createKey()

      const query = useQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      })

      expectTypeOf(query.data).toEqualTypeOf<Ref<string> | Ref<undefined>>()
    })

    it('should narrow data.value on an undefined check without reactive()', () => {
      const key = createKey()

      const { data } = useQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      })

      if (data.value !== undefined) {
        expectTypeOf(data.value).toEqualTypeOf<string>()
        expectTypeOf(data).toEqualTypeOf<Ref<string>>()
      }
    })
  })

  describe('accept ref options', () => {
    it('should accept ref options', () => {
      const options = ref({
        queryKey: createKey(),
        queryFn: () => sleep(0).then(() => 'Some data'),
      })

      const query = reactive(useQuery(options))

      if (query.isSuccess) {
        expectTypeOf(query.data).toEqualTypeOf<string>()
      }
    })

    it('should accept computed options', () => {
      const options = computed(() => ({
        queryKey: createKey(),
        queryFn: () => sleep(0).then(() => 'Some data'),
      }))

      const query = reactive(useQuery(options))

      if (query.isSuccess) {
        expectTypeOf(query.data).toEqualTypeOf<string>()
      }
    })

    it('should accept computed query options', () => {
      const options = computed(() =>
        queryOptions({
          queryKey: createKey(),
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
      )

      const query = reactive(useQuery(options))

      if (query.isSuccess) {
        expectTypeOf(query.data).toEqualTypeOf<string>()
      }
    })
  })

  describe('skipToken', () => {
    it('should accept skipToken inside a whole-options getter', () => {
      const id = ref<string | null>('1')

      const query = reactive(
        useQuery(() => {
          const current = id.value
          return {
            queryKey: ['post', current],
            queryFn: current
              ? () => sleep(0).then(() => 'Some data')
              : skipToken,
          }
        }),
      )

      if (query.isSuccess) {
        expectTypeOf(query.data).toEqualTypeOf<string>()
      }
    })
  })

  describe('queryKey reactivity rules', () => {
    it('should accept a bare reactive getter for the whole queryKey array', () => {
      const id = ref(1)
      assertType(
        useQuery({
          queryKey: () => ['post', id.value],
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
      )
    })
  })

  describe('select', () => {
    it('should narrow data to the type select returns', () => {
      const { data } = useQuery({
        queryKey: createKey(),
        queryFn: () => sleep(0).then(() => ['a', 'b', 'c']),
        select: (posts) => posts.length,
      })

      expectTypeOf(data.value).toEqualTypeOf<number | undefined>()
    })
  })
})
