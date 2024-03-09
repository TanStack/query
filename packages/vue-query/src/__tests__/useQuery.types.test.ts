import { describe, it } from 'vitest'
import { reactive } from 'vue-demi'
import { useQuery } from '../useQuery'
import { queryOptions } from '../queryOptions'
import { doNotExecute, simpleFetcher } from './test-utils'
import type { UseQueryOptions } from '../useQuery'
import type { Equal, Expect } from './test-utils'

describe('initialData', () => {
  describe('Config object overload', () => {
    it('TData should always be defined when initialData is provided as an object', () => {
      doNotExecute(() => {
        const { data } = reactive(
          useQuery({
            queryKey: ['key'],
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

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true

        return result
      })
    })

    it('TData should be defined when passed through queryOptions', () => {
      doNotExecute(() => {
        const options = queryOptions({
          queryKey: ['key'],
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

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
      })
    })

    it('it should be possible to define a different TData than TQueryFnData using select with queryOptions spread into useQuery', () => {
      doNotExecute(() => {
        const options = queryOptions({
          queryKey: ['key'],
          queryFn: () => Promise.resolve(1),
        })

        const query = reactive(
          useQuery({
            ...options,
            select: (data) => data > 1,
          }),
        )

        const result: Expect<Equal<boolean | undefined, typeof query.data>> =
          true
        return result
      })
    })

    it('TData should always be defined when initialData is provided as a function which ALWAYS returns the data', () => {
      doNotExecute(() => {
        const { data } = reactive(
          useQuery({
            queryKey: ['key'],
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

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
      })
    })

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      doNotExecute(() => {
        const { data } = reactive(
          useQuery({
            queryKey: ['key'],
            queryFn: () => {
              return {
                wow: true,
              }
            },
          }),
        )

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })

    it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
      doNotExecute(() => {
        const { data } = reactive(
          useQuery({
            queryKey: ['key'],
            queryFn: () => {
              return {
                wow: true,
              }
            },
            initialData: () => undefined as { wow: boolean } | undefined,
          }),
        )

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })

    it('TData should be narrowed after an isSuccess check when initialData is provided as a function which can return undefined', () => {
      doNotExecute(() => {
        const { data, isSuccess } = reactive(
          useQuery({
            queryKey: ['key'],
            queryFn: () => {
              return {
                wow: true,
              }
            },
            initialData: () => undefined as { wow: boolean } | undefined,
          }),
        )

        if (isSuccess) {
          const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
          return result
        }
        return false
      })
    })
  })

  describe('custom composable', () => {
    it('should allow custom composable using UseQueryOptions', () => {
      doNotExecute(() => {
        type Data = string

        const useCustomQuery = (
          options?: Omit<UseQueryOptions<Data>, 'queryKey' | 'queryFn'>,
        ) => {
          return useQuery({
            ...options,
            queryKey: ['todos-key'],
            queryFn: () => Promise.resolve('data'),
          })
        }

        const { data } = reactive(useCustomQuery())

        const result: Expect<Equal<Data | undefined, typeof data>> = true
        return result
      })
    })
  })

  describe('structuralSharing', () => {
    it('should restrict to same types', () => {
      doNotExecute(() => {
        useQuery({
          queryKey: ['key'],
          queryFn: () => 5,
          structuralSharing: (_oldData, newData) => {
            return newData
          },
        })
      })
    })
  })

  describe('Discriminated union return type', () => {
    it('data should be possibly undefined by default', () => {
      doNotExecute(() => {
        const query = reactive(
          useQuery({
            queryKey: ['key'],
            queryFn: simpleFetcher,
          }),
        )

        const result: Expect<Equal<string | undefined, typeof query.data>> =
          true
        return result
      })
    })

    it('data should be defined when query is success', () => {
      doNotExecute(() => {
        const query = reactive(
          useQuery({
            queryKey: ['key'],
            queryFn: simpleFetcher,
          }),
        )

        if (query.isSuccess) {
          const result: Expect<Equal<string, typeof query.data>> = true
          return result
        }
        return
      })
    })

    it('error should be null when query is success', () => {
      doNotExecute(() => {
        const query = reactive(
          useQuery({
            queryKey: ['key'],
            queryFn: simpleFetcher,
          }),
        )

        if (query.isSuccess) {
          const result: Expect<Equal<null, typeof query.error>> = true
          return result
        }
        return
      })
    })

    it('data should be undefined when query is pending', () => {
      doNotExecute(() => {
        const query = reactive(
          useQuery({
            queryKey: ['key'],
            queryFn: simpleFetcher,
          }),
        )

        if (query.isPending) {
          const result: Expect<Equal<undefined, typeof query.data>> = true
          return result
        }
        return
      })
    })

    it('error should be defined when query is error', () => {
      doNotExecute(() => {
        const query = reactive(
          useQuery({
            queryKey: ['key'],
            queryFn: simpleFetcher,
          }),
        )

        if (query.isError) {
          const result: Expect<Equal<Error, typeof query.error>> = true
          return result
        }
        return
      })
    })
  })
})
