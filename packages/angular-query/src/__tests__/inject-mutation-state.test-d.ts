import { describe, expectTypeOf, it } from 'vitest'
import { injectMutationState } from '..'
import type { Mutation, MutationState, MutationStatus } from '..'

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

  it('should infer the mutation type from a mutation-state result', () => {
    type Result = MutationState<
      string,
      Error,
      { id: number },
      { previous: string }
    >

    injectMutationState<Result>(() => ({
      select: (mutation) => {
        expectTypeOf(mutation).toEqualTypeOf<
          Mutation<string, Error, { id: number }, { previous: string }>
        >()
        return mutation.state
      },
    }))
  })
})
