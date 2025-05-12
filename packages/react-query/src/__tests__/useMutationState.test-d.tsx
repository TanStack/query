import { describe, expectTypeOf, it } from 'vitest'
import { useMutationState } from '../useMutationState'
import type { MutationState, MutationStatus } from '@tanstack/query-core'

describe('useMutationState', () => {
  it('should default to QueryState', () => {
    const result = useMutationState({
      filters: { status: 'pending' },
    })

    expectTypeOf(result).toEqualTypeOf<
      Array<MutationState<unknown, Error, unknown, unknown>>
    >()
  })
  it('should infer with select', () => {
    const result = useMutationState({
      filters: { status: 'pending' },
      select: (mutation) => mutation.state.status,
    })

    expectTypeOf(result).toEqualTypeOf<Array<MutationStatus>>()
  })
})
