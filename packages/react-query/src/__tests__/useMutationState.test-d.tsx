import { describe, expectTypeOf, it } from 'vitest'
import { useMutationState } from '../useMutationState'
import type { Mutation, MutationState, MutationStatus } from '@tanstack/query-core'

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
  it('should propagate TMutation generics into select callback', () => {
    type MyData = { id: number }
    type MyError = { code: number }
    type MyVariables = { name: string }

    const result = useMutationState<
      MutationState<MyData, MyError, MyVariables>,
      Mutation<MyData, MyError, MyVariables>
    >({
      filters: { mutationKey: ['key'] },
      select: (mutation) => {
        expectTypeOf(mutation).toEqualTypeOf<
          Mutation<MyData, MyError, MyVariables>
        >()
        expectTypeOf(mutation.state.data).toEqualTypeOf<MyData | undefined>()
        expectTypeOf(mutation.state.error).toEqualTypeOf<MyError | null>()
        expectTypeOf(mutation.state.variables).toEqualTypeOf<
          MyVariables | undefined
        >()
        return mutation.state
      },
    })

    expectTypeOf(result).toEqualTypeOf<
      Array<MutationState<MyData, MyError, MyVariables>>
    >()
  })
})
