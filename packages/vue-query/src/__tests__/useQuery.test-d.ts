import { describe, expectTypeOf, it } from 'vitest'
import { computed, reactive, ref } from 'vue-demi'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { queryOptions, useQuery } from '..'
import type { Ref } from 'vue-demi'
import type { OmitKeyof, UseQueryOptions } from '..'

describe('useQuery', () => {
  describe('Config object overload', () => {
    it('TData should always be defined when initialData is provided as an object', () => {
      const key = queryKey()

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

    it('TData should be defined when passed through queryOptions', () => {
      const key = queryKey()

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
      const key = queryKey()

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

    it('TData should always be defined when initialData is provided as a function which ALWAYS returns the data', () => {
      const key = queryKey()

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

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      const key = queryKey()

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

    it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
      const key = queryKey()

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

    it('TData should be narrowed after an isSuccess check when initialData is provided as a function which can return undefined', () => {
      const key = queryKey()

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

    it('data should not have undefined when initialData is provided', () => {
      const key = queryKey()

      const { data } = reactive(
        useQuery({
          queryKey: key,
          initialData: 42,
        }),
      )

      expectTypeOf(data).toEqualTypeOf<number>()
    })
  })

  describe('custom composable', () => {
    it('should allow custom composable using UseQueryOptions', () => {
      const key = queryKey()

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
      const key = queryKey()

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

  describe('Discriminated union return type', () => {
    it('data should be possibly undefined by default', () => {
      const key = queryKey()

      const query = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
      )

      expectTypeOf(query.data).toEqualTypeOf<string | undefined>()
    })

    it('data should be defined when query is success', () => {
      const key = queryKey()

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

    it('error should be null when query is success', () => {
      const key = queryKey()

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

    it('data should be undefined when query is pending', () => {
      const key = queryKey()

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

    it('error should be defined when query is error', () => {
      const key = queryKey()

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
  })

  // Regression coverage for #9244 — narrowing across the discriminated
  // result union from useQuery() under the patterns users actually write.
  describe('issue #9244 — narrowing without reactive()', () => {
    it('useQuery() return preserves the discriminated union (no reactive())', () => {
      const key = queryKey()

      const query = useQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      })

      // Whole-result narrowing requires reactive() because the discriminator
      // sits inside `Ref<boolean>`. The `data` ref itself is still a
      // discriminated union of `Ref<string> | Ref<undefined>` (matches the
      // shape documented in docs/framework/vue/typescript.md).
      expectTypeOf(query.data).toEqualTypeOf<Ref<string> | Ref<undefined>>()
    })

    it('data.value narrows after a direct undefined check', () => {
      const key = queryKey()

      const { data } = useQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      })

      // This is the recommended pattern when `reactive()` is not used:
      // narrow on `.value !== undefined` rather than relying on `isSuccess`.
      if (data.value !== undefined) {
        expectTypeOf(data.value).toEqualTypeOf<string>()
        expectTypeOf(data).toEqualTypeOf<Ref<string>>()
      }
    })

    it('reactive() preserves narrowing across destructured properties', () => {
      const key = queryKey()

      // Destructuring directly from `useQuery()` (without `reactive()`)
      // breaks cross-property narrowing because each ref is independent —
      // wrapping in `reactive()` flattens the refs and keeps the
      // discriminated union linkage.
      const { data, isSuccess } = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
      )

      if (isSuccess) {
        expectTypeOf(data).toEqualTypeOf<string>()
      }
    })

    it('reactive() narrows on status discriminator', () => {
      const key = queryKey()

      const { data, status } = reactive(
        useQuery({
          queryKey: key,
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
      )

      if (status === 'success') {
        expectTypeOf(data).toEqualTypeOf<string>()
      }
    })
  })

  describe('accept ref options', () => {
    it('should accept ref options', () => {
      const options = ref({
        queryKey: queryKey(),
        queryFn: () => sleep(0).then(() => 'Some data'),
      })

      const query = reactive(useQuery(options))

      if (query.isSuccess) {
        expectTypeOf(query.data).toEqualTypeOf<string>()
      }
    })

    it('should accept computed options', () => {
      const options = computed(() => ({
        queryKey: queryKey(),
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
          queryKey: queryKey(),
          queryFn: () => sleep(0).then(() => 'Some data'),
        }),
      )

      const query = reactive(useQuery(options))

      if (query.isSuccess) {
        expectTypeOf(query.data).toEqualTypeOf<string>()
      }
    })
  })
})
