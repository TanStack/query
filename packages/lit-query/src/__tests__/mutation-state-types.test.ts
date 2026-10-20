import { QueryClient } from '@tanstack/query-core'
import { LitElement } from 'lit'
import { describe, expectTypeOf, it } from 'vitest'
import { useMutationState } from '../useMutationState.js'
import { generateElementName } from './utils.js'
import type {
  Mutation,
  MutationState,
  MutationStatus,
} from '@tanstack/query-core'

describe('useMutationState types', () => {
  it('defaults to mutation state with the default error type', () => {
    class Host extends LitElement {}
    customElements.define(generateElementName(), Host)

    const result = useMutationState(
      new Host(),
      { filters: { status: 'pending' } },
      new QueryClient(),
    )

    expectTypeOf(result()).toEqualTypeOf<
      Array<MutationState<unknown, Error, unknown, unknown>>
    >()
  })

  it('infers the selected status', () => {
    class Host extends LitElement {}
    customElements.define(generateElementName(), Host)

    const result = useMutationState(
      new Host(),
      {
        filters: { status: 'pending' },
        select: (mutation) => mutation.state.status,
      },
      new QueryClient(),
    )

    expectTypeOf(result()).toEqualTypeOf<Array<MutationStatus>>()
  })

  it('allows selecting a default error message', () => {
    class Host extends LitElement {}
    customElements.define(generateElementName(), Host)

    const result = useMutationState(
      new Host(),
      { select: (mutation) => mutation.state.error?.message },
      new QueryClient(),
    )

    expectTypeOf(result()).toEqualTypeOf<Array<string | undefined>>()
  })

  it('propagates typed mutation state generics to the select callback', () => {
    type MyData = { data: Array<string> }
    type MyError = { code: number; message: string }
    type MyVariables = { id: number }

    class Host extends LitElement {}
    customElements.define(generateElementName(), Host)

    useMutationState<MutationState<MyData, MyError, MyVariables>>(
      new Host(),
      {
        filters: { mutationKey: ['key'] },
        select: (mutation) => {
          expectTypeOf(mutation).toEqualTypeOf<
            Mutation<MyData, MyError, MyVariables, unknown>
          >()
          return mutation.state
        },
      },
      new QueryClient(),
    )
  })
})
