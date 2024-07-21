import { describe, expectTypeOf } from 'vitest'
import { injectMutationState } from '..'
import type { MutationState, MutationStatus } from '..'

describe('injectMutationState', () => {
  it('should default to QueryState', () => {
    const result = injectMutationState(() => ({
      filters: { status: 'pending' },
    }))

    expectTypeOf(result()).toEqualTypeOf<Array<MutationState>>()
  })

  it('should infer with select', () => {
    const result = injectMutationState(() => ({
      filters: { status: 'pending' },
      select: (mutation) => mutation.state.status,
    }))

    expectTypeOf(result()).toEqualTypeOf<Array<MutationStatus>>()
  })
})
