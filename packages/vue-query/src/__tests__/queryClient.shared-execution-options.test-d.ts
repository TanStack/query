import { skipToken } from '@tanstack/query-core'
import { describe, expectTypeOf, it } from 'vitest'
import { computed, ref } from 'vue'
import { QueryClient } from '../queryClient'
import { queryOptions } from '../queryOptions'
import { useQuery } from '../useQuery'
import type { UseQueryOptions } from '../queryOptions'

describe('shared query options', () => {
  it('should accept annotated reactive options and preserve selected and cached types', () => {
    const queryClient = new QueryClient()
    const enabled = ref(true)
    const options: UseQueryOptions<string, Error, number> = {
      queryKey: () => ['key', { id: ref(1) }],
      queryFn: computed(() =>
        enabled.value ? () => Promise.resolve('value') : skipToken,
      ),
      select: (data) => data.length,
    }

    expectTypeOf(queryClient.query(options)).toEqualTypeOf<
      Promise<number | undefined>
    >()
  })

  it('should accept annotated options in a root ref', () => {
    const queryClient = new QueryClient()
    const options: UseQueryOptions<string> = ref({
      queryKey: () => ['key'],
      queryFn: () => Promise.resolve('value'),
    })

    expectTypeOf(queryClient.query(options)).toEqualTypeOf<
      Promise<string | undefined>
    >()
  })

  it('should preserve explicit generic arguments', () => {
    const queryClient = new QueryClient()
    const options: UseQueryOptions<string, Error, number, string, ['key']> = {
      queryKey: () => ['key'],
      queryFn: () => Promise.resolve('value'),
      select: (data) => data.length,
    }

    expectTypeOf(
      queryClient.query<string, Error, number, string, ['key'], never>(options),
    ).toEqualTypeOf<Promise<number | undefined>>()
  })

  it('should retain mutable extracted skipToken options', () => {
    const queryClient = new QueryClient()
    const options = { queryKey: ['key'], queryFn: skipToken }
    const sharedOptions: UseQueryOptions<number> = options

    useQuery(options)
    queryOptions(options)

    expectTypeOf(queryClient.query(sharedOptions)).toEqualTypeOf<
      Promise<number | undefined>
    >()
  })
})
