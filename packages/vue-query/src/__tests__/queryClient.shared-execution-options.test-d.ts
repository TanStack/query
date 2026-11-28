import { select, skipToken } from '@tanstack/query-core'
import { describe, expectTypeOf, it } from 'vitest'
import { computed, ref } from 'vue'
import { QueryClient, query } from '../queryClient'
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
      select: [select, (data) => data.length],
    }

    expectTypeOf(query(queryClient, options)).toEqualTypeOf<
      Promise<number | undefined>
    >()
  })

  it('should accept annotated options in a root ref', () => {
    const queryClient = new QueryClient()
    const options: UseQueryOptions<string> = ref({
      queryKey: () => ['key'],
      queryFn: () => Promise.resolve('value'),
    })

    expectTypeOf(query(queryClient, options)).toEqualTypeOf<
      Promise<string | undefined>
    >()
  })

  it('should preserve explicit generic arguments', () => {
    const queryClient = new QueryClient()
    const options: UseQueryOptions<string, Error, number, string, ['key']> = {
      queryKey: () => ['key'],
      queryFn: () => Promise.resolve('value'),
      select: [select, (data) => data.length],
    }

    expectTypeOf(
      query<string, Error, number, string, ['key'], never>(
        queryClient,
        options,
      ),
    ).toEqualTypeOf<Promise<number | undefined>>()
  })

  it('should retain mutable extracted skipToken options', () => {
    const queryClient = new QueryClient()
    const options = { queryKey: ['key'], queryFn: skipToken }
    const sharedOptions: UseQueryOptions<number> = options

    useQuery(options)
    queryOptions(options)

    expectTypeOf(query(queryClient, sharedOptions)).toEqualTypeOf<
      Promise<number | undefined>
    >()
  })
})
