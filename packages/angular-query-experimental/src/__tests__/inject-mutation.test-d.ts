import { describe, expectTypeOf, it } from 'vitest'
import { sleep } from '@tanstack/query-test-utils'
import { injectMutation } from '..'
import type { Signal } from '@angular/core'

describe('injectMutation', () => {
  describe('Discriminated union return type', () => {
    it('data should be possibly undefined by default', () => {
      const mutation = injectMutation(() => ({
        mutationFn: () => sleep(0).then(() => 'string'),
      }))

      expectTypeOf(mutation.data).toEqualTypeOf<Signal<string | undefined>>()
    })

    it('data should be defined when mutation is success', () => {
      const mutation = injectMutation(() => ({
        mutationFn: () => sleep(0).then(() => 'string'),
      }))

      if (mutation.isSuccess()) {
        expectTypeOf(mutation.data).toEqualTypeOf<Signal<string>>()
      }
    })

    it('error should be null when mutation is success', () => {
      const mutation = injectMutation(() => ({
        mutationFn: () => sleep(0).then(() => 'string'),
      }))

      if (mutation.isSuccess()) {
        expectTypeOf(mutation.error).toEqualTypeOf<Signal<null>>()
      }
    })

    it('data should be undefined when mutation is pending', () => {
      const mutation = injectMutation(() => ({
        mutationFn: () => sleep(0).then(() => 'string'),
      }))

      if (mutation.isPending()) {
        expectTypeOf(mutation.data).toEqualTypeOf<Signal<undefined>>()
      }
    })

    it('error should be defined when mutation is error', () => {
      const mutation = injectMutation(() => ({
        mutationFn: () => sleep(0).then(() => 'string'),
      }))

      if (mutation.isError()) {
        expectTypeOf(mutation.error).toEqualTypeOf<Signal<Error>>()
      }
    })

    it('should narrow variables', () => {
      const mutation = injectMutation(() => ({
        mutationFn: (_variables: string) => sleep(0).then(() => 'string'),
      }))

      if (mutation.isIdle()) {
        expectTypeOf(mutation.variables).toEqualTypeOf<Signal<undefined>>()
      }
      if (mutation.isPending()) {
        expectTypeOf(mutation.variables).toEqualTypeOf<Signal<string>>()
      }
      if (mutation.isSuccess()) {
        expectTypeOf(mutation.variables).toEqualTypeOf<Signal<string>>()
      }
      expectTypeOf(mutation.variables).toEqualTypeOf<
        Signal<string | undefined>
      >()
    })
  })

  it('should infer TOnMutateResult from onMutate return type', () => {
    injectMutation(() => ({
      mutationFn: () => sleep(0).then(() => 'string'),
      onMutate: () => {
        return { token: 'abc' }
      },
      onSuccess: (_data, _variables, onMutateResult) => {
        expectTypeOf(onMutateResult).toEqualTypeOf<{ token: string }>()
      },
      onError: (_error, _variables, onMutateResult) => {
        expectTypeOf(onMutateResult).toEqualTypeOf<
          { token: string } | undefined
        >()
      },
    }))
  })

  it('should allow calling mutate with no arguments when TVariables is optional undefinable', () => {
    const mutation = injectMutation(() => ({
      mutationFn: (_variables: number | undefined) => sleep(0).then(() => 1),
    }))

    expectTypeOf(mutation.mutate).toBeCallableWith()
    expectTypeOf(mutation.mutateAsync).toBeCallableWith()
  })
})
