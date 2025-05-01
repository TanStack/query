import { describe, expectTypeOf, it } from 'vitest'
import { computed, reactive, ref } from 'vue-demi'
import { useQuery } from '../useQuery'
import { queryOptions } from '../queryOptions'
import { simpleFetcher } from './test-utils'
import type { OmitKeyof } from '..'
import type { UseQueryOptions } from '../useQuery'

// `initialData` can be `optional property` or `required property`.
// These can be denoted with prefixes `p` and `r`, respectively.
// Possible values are `undefined`, `()=>undefined`, `TData|undefined`, `()=>TData|undefined`, `TData`, `()=>TData`.
// Each presence can be represented as a bit.
// Combinations result in examples like:
// ex)
// {initialData ?: undefined} => p100000
// {initialData : (()⇒TData|undefined) | TData} => r000110

// For reference,
// if the prefix is `r` && at least one of the last two bits is 1 && all bits except the last two are 0,
// it should be `DefinedInitialQueryOptions`
// otherwise, it should be `UndefinedInitialQueryOptions`.

type Bit = '0' | '1'
type OptionalPrefix = 'p' | 'r'
type InitialDataCode = `${OptionalPrefix}${Bit}${Bit}${Bit}${Bit}${Bit}${Bit}`
type StringTuple<TString extends string> =
  TString extends `${infer Start}${infer Rest}`
    ? [Start, ...StringTuple<Rest>]
    : []

type InitialDataType<TData, TTuple extends Array<string>> =
  | (TTuple[1] extends '1' ? undefined : never)
  | (TTuple[2] extends '1' ? () => undefined : never)
  | (TTuple[3] extends '1' ? TData | undefined : never)
  | (TTuple[4] extends '1' ? () => TData | undefined : never)
  | (TTuple[5] extends '1' ? TData : never)
  | (TTuple[6] extends '1' ? () => TData : never)

type InitialDataOption<
  TData,
  TCode extends InitialDataCode,
  TTuple extends Array<string> = StringTuple<TCode>,
> = TTuple[0] extends 'p'
  ? { initialData?: InitialDataType<TData, TTuple> }
  : { initialData: InitialDataType<TData, TTuple> }

function getInitQueryOption<TData, TCode extends InitialDataCode>(data: TData) {
  const defaultOption: { queryKey: ['key']; queryFn: () => TData } = {
    queryKey: ['key'],
    queryFn: () => data,
  }
  return defaultOption as typeof defaultOption & InitialDataOption<TData, TCode>
}

describe('useQuery', () => {
  describe('Config object overload', () => {
    it('TData should have undefined in the union when initialData is optional property', () => {
      const { data: p000000Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p000000'>({ type: 'hello' }),
        ),
      )
      const { data: p000001Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p000001'>({ type: 'hello' }),
        ),
      )
      const { data: p000010Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p000010'>({ type: 'hello' }),
        ),
      )
      const { data: p000011Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p000011'>({ type: 'hello' }),
        ),
      )
      const { data: p000100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p000100'>({ type: 'hello' }),
        ),
      )
      const { data: p000101Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p000101'>({ type: 'hello' }),
        ),
      )
      const { data: p000110Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p000110'>({ type: 'hello' }),
        ),
      )
      const { data: p000111Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p000111'>({ type: 'hello' }),
        ),
      )
      const { data: p001000Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p001000'>({ type: 'hello' }),
        ),
      )
      const { data: p001001Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p001001'>({ type: 'hello' }),
        ),
      )
      const { data: p001010Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p001010'>({ type: 'hello' }),
        ),
      )
      const { data: p001011Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p001011'>({ type: 'hello' }),
        ),
      )
      const { data: p001100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p001100'>({ type: 'hello' }),
        ),
      )
      const { data: p001101Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p001101'>({ type: 'hello' }),
        ),
      )
      const { data: p001110Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p001110'>({ type: 'hello' }),
        ),
      )
      const { data: p001111Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p001111'>({ type: 'hello' }),
        ),
      )
      const { data: p010000Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p010000'>({ type: 'hello' }),
        ),
      )
      const { data: p010001Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p010001'>({ type: 'hello' }),
        ),
      )
      const { data: p010010Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p010010'>({ type: 'hello' }),
        ),
      )
      const { data: p010011Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p010011'>({ type: 'hello' }),
        ),
      )
      const { data: p010100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p010100'>({ type: 'hello' }),
        ),
      )
      const { data: p010101Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p010101'>({ type: 'hello' }),
        ),
      )
      const { data: p010110Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p010110'>({ type: 'hello' }),
        ),
      )
      const { data: p010111Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p010111'>({ type: 'hello' }),
        ),
      )
      const { data: p011000Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p011000'>({ type: 'hello' }),
        ),
      )
      const { data: p011001Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p011001'>({ type: 'hello' }),
        ),
      )
      const { data: p011010Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p011010'>({ type: 'hello' }),
        ),
      )
      const { data: p011011Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p011011'>({ type: 'hello' }),
        ),
      )
      const { data: p011100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p011100'>({ type: 'hello' }),
        ),
      )
      const { data: p011101Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p011101'>({ type: 'hello' }),
        ),
      )
      const { data: p011110Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p011110'>({ type: 'hello' }),
        ),
      )
      const { data: p011111Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p011111'>({ type: 'hello' }),
        ),
      )
      const { data: p100000Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p100000'>({ type: 'hello' }),
        ),
      )
      const { data: p100001Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p100001'>({ type: 'hello' }),
        ),
      )
      const { data: p100010Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p100010'>({ type: 'hello' }),
        ),
      )
      const { data: p100011Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p100011'>({ type: 'hello' }),
        ),
      )
      const { data: p100100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p100100'>({ type: 'hello' }),
        ),
      )
      const { data: p100101Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p100101'>({ type: 'hello' }),
        ),
      )
      const { data: p100110Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p100110'>({ type: 'hello' }),
        ),
      )
      const { data: p100111Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p100111'>({ type: 'hello' }),
        ),
      )
      const { data: p101000Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p101000'>({ type: 'hello' }),
        ),
      )
      const { data: p101001Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p101001'>({ type: 'hello' }),
        ),
      )
      const { data: p101010Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p101010'>({ type: 'hello' }),
        ),
      )
      const { data: p101011Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p101011'>({ type: 'hello' }),
        ),
      )
      const { data: p101100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p101100'>({ type: 'hello' }),
        ),
      )
      const { data: p101101Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p101101'>({ type: 'hello' }),
        ),
      )
      const { data: p101110Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p101110'>({ type: 'hello' }),
        ),
      )
      const { data: p101111Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p101111'>({ type: 'hello' }),
        ),
      )
      const { data: p110000Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p110000'>({ type: 'hello' }),
        ),
      )
      const { data: p110001Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p110001'>({ type: 'hello' }),
        ),
      )
      const { data: p110010Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p110010'>({ type: 'hello' }),
        ),
      )
      const { data: p110011Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p110011'>({ type: 'hello' }),
        ),
      )
      const { data: p110100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p110100'>({ type: 'hello' }),
        ),
      )
      const { data: p110101Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p110101'>({ type: 'hello' }),
        ),
      )
      const { data: p110110Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p110110'>({ type: 'hello' }),
        ),
      )
      const { data: p110111Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p110111'>({ type: 'hello' }),
        ),
      )
      const { data: p111000Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p111000'>({ type: 'hello' }),
        ),
      )
      const { data: p111001Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p111001'>({ type: 'hello' }),
        ),
      )
      const { data: p111010Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p111010'>({ type: 'hello' }),
        ),
      )
      const { data: p111011Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p111011'>({ type: 'hello' }),
        ),
      )
      const { data: p111100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p111100'>({ type: 'hello' }),
        ),
      )
      const { data: p111101Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p111101'>({ type: 'hello' }),
        ),
      )
      const { data: p111110Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p111110'>({ type: 'hello' }),
        ),
      )
      const { data: p111111Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'p111111'>({ type: 'hello' }),
        ),
      )
      expectTypeOf(p000000Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p000001Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p000010Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p000011Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p000100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p000101Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p000110Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p000111Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p001000Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p001001Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p001010Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p001011Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p001100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p001101Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p001110Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p001111Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p010000Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p010001Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p010010Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p010011Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p010100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p010101Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p010110Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p010111Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p011000Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p011001Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p011010Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p011011Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p011100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p011101Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p011110Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p011111Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p100000Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p100001Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p100010Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p100011Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p100100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p100101Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p100110Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p100111Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p101000Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p101001Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p101010Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p101011Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p101100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p101101Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p101110Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p101111Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p110000Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p110001Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p110010Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p110011Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p110100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p110101Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p110110Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p110111Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p111000Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p111001Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p111010Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p111011Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p111100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p111101Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p111110Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(p111111Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
    })

    it('TData should have undefined in the union when initialData has undefined', () => {
      const { data: r000000Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'r000000'>({ type: 'hello' }),
        ),
      )
      const { data: r000100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'r000100'>({ type: 'hello' }),
        ),
      )
      const { data: r001100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'r001100'>({ type: 'hello' }),
        ),
      )
      const { data: r010100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'r010100'>({ type: 'hello' }),
        ),
      )
      const { data: r011100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'r011100'>({ type: 'hello' }),
        ),
      )
      const { data: r100100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'r100100'>({ type: 'hello' }),
        ),
      )
      const { data: r101100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'r101100'>({ type: 'hello' }),
        ),
      )
      const { data: r110100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'r110100'>({ type: 'hello' }),
        ),
      )
      const { data: r111100Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'r111100'>({ type: 'hello' }),
        ),
      )

      expectTypeOf(r000000Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(r000100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(r001100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(r010100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(r011100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(r100100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(r101100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(r110100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
      expectTypeOf(r111100Data).toEqualTypeOf<{ type: 'hello' } | undefined>()
    })

    it('TData should always be defined when initialData does not have undefined', () => {
      const { data: r000001Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'r000001'>({ type: 'hello' }),
        ),
      )
      const { data: r000010Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'r000010'>({ type: 'hello' }),
        ),
      )
      const { data: r000011Data } = reactive(
        useQuery(
          getInitQueryOption<{ type: 'hello' }, 'r000011'>({ type: 'hello' }),
        ),
      )

      expectTypeOf(r000001Data).toEqualTypeOf<{ type: 'hello' }>()
      expectTypeOf(r000010Data).toEqualTypeOf<{ type: 'hello' }>()
      expectTypeOf(r000011Data).toEqualTypeOf<{ type: 'hello' }>()
    })
  })

  describe('custom composable', () => {
    it('should allow custom composable using UseQueryOptions', () => {
      const useCustomQuery = (
        options?: OmitKeyof<
          UseQueryOptions<string>,
          'queryKey' | 'queryFn',
          'safely'
        >,
      ) => {
        return useQuery({
          ...options,
          queryKey: ['todos-key'],
          queryFn: () => Promise.resolve('data'),
        })
      }

      const { data } = reactive(useCustomQuery())

      expectTypeOf(data).toEqualTypeOf<string | undefined>()
    })
  })

  describe('structuralSharing', () => {
    it('should restrict to same types', () => {
      useQuery({
        queryKey: ['key'],
        queryFn: () => 5,
        structuralSharing: (_oldData, newData) => {
          return newData
        },
      })
    })
  })

  describe('Discriminated union return type', () => {
    it('data should be possibly undefined by default', () => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      expectTypeOf(query.data).toEqualTypeOf<string | undefined>()
    })

    it('data should be defined when query is success', () => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      if (query.isSuccess) {
        expectTypeOf(query.data).toEqualTypeOf<string>()
      }
    })

    it('error should be null when query is success', () => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      if (query.isSuccess) {
        expectTypeOf(query.error).toEqualTypeOf<null>()
      }
    })

    it('data should be undefined when query is pending', () => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      if (query.isPending) {
        expectTypeOf(query.data).toEqualTypeOf<undefined>()
      }
    })

    it('error should be defined when query is error', () => {
      const query = reactive(
        useQuery({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      if (query.isError) {
        expectTypeOf(query.error).toEqualTypeOf<Error>()
      }
    })
  })

  describe('accept ref options', () => {
    it('should accept ref options', () => {
      const options = ref({
        queryKey: ['key'],
        queryFn: simpleFetcher,
      })

      const query = reactive(useQuery(options))

      if (query.isSuccess) {
        expectTypeOf(query.data).toEqualTypeOf<string>()
      }
    })

    it('should accept computed options', () => {
      const options = computed(() => ({
        queryKey: ['key'],
        queryFn: simpleFetcher,
      }))

      const query = reactive(useQuery(options))

      if (query.isSuccess) {
        expectTypeOf(query.data).toEqualTypeOf<string>()
      }
    })

    it('should accept computed query options', () => {
      const options = computed(() =>
        queryOptions({
          queryKey: ['key'],
          queryFn: simpleFetcher,
        }),
      )

      const query = reactive(useQuery(options))

      if (query.isSuccess) {
        expectTypeOf(query.data).toEqualTypeOf<string>()
      }
    })
  })
})
