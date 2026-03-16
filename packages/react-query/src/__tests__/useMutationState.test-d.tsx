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
  it('should propagate mutation generics to select callback', () => {
    type MyData = { id: number }
    type MyError = { code: string }
    type MyVariables = { name: string }

    const result = useMutationState<MyData, MyError, MyVariables>({
      filters: { mutationKey: ['my-mutation'] },
      select: (mutation) => {
        // mutation should be typed as Mutation<MyData, MyError, MyVariables, unknown>
        expectTypeOf(mutation.state.data).toEqualTypeOf<MyData | undefined>()
        expectTypeOf(mutation.state.error).toEqualTypeOf<MyError | null>()
        expectTypeOf(mutation.state.variables).toEqualTypeOf<
          MyVariables | undefined
        >()
        return mutation.state
      },
    })

    expectTypeOf(result).toEqualTypeOf<
      Array<MutationState<MyData, MyError, MyVariables, unknown>>
    >()
  })
  it('should allow custom TResult when providing select', () => {
    type MyVariables = { userId: string }

    const result = useMutationState<
      unknown,
      Error,
      MyVariables,
      unknown,
      string
    >({
      filters: { status: 'pending' },
      select: (mutation) => mutation.state.variables?.userId ?? '',
    })

    expectTypeOf(result).toEqualTypeOf<Array<string>>()
  })
})
