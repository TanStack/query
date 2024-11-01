import { describe, expectTypeOf, it } from 'vitest'
import { skipToken } from '@tanstack/query-core'
import { useSuspenseQuery } from '../useSuspenseQuery'

describe('useSuspenseQuery', () => {
  it('should always have data defined', () => {
    const { data } = useSuspenseQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should not have pending status', () => {
    const { status } = useSuspenseQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(status).toEqualTypeOf<'error' | 'success'>()
  })

  it('should not allow skipToken in queryFn', () => {
    useSuspenseQuery({
      queryKey: ['key'],
      // @ts-expect-error
      queryFn: skipToken,
    })

    useSuspenseQuery({
      queryKey: ['key'],
      // @ts-expect-error
      queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
    })
  })

  it('should not allow placeholderData, enabled or throwOnError props', () => {
    useSuspenseQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      placeholderData: 5,
      enabled: true,
    })

    useSuspenseQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      enabled: true,
    })

    useSuspenseQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      throwOnError: true,
    })
  })

  it('should not return isPlaceholderData', () => {
    const query = useSuspenseQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    // @ts-expect-error TS2339
    query.isPlaceholderData
  })
})
