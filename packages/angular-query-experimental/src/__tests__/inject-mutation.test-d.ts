import { describe, expectTypeOf, test } from 'vitest'
import { sleep } from '@tanstack/query-test-utils'
import { injectMutation } from '..'
import type { Signal } from '@angular/core'

describe('Discriminated union return type', () => {
  test('data should be possibly undefined by default', () => {
    const mutation = injectMutation(() => ({
      mutationFn: () => sleep(0).then(() => 'string'),
    }))

    expectTypeOf(mutation.data).toEqualTypeOf<Signal<string | undefined>>()
  })

  test('data should be defined when mutation is success', () => {
    const mutation = injectMutation(() => ({
      mutationFn: () => sleep(0).then(() => 'string'),
    }))

    if (mutation.isSuccess()) {
      expectTypeOf(mutation.data).toEqualTypeOf<Signal<string>>()
    }
  })

  test('error should be null when mutation is success', () => {
    const mutation = injectMutation(() => ({
      mutationFn: () => sleep(0).then(() => 'string'),
    }))

    if (mutation.isSuccess()) {
      expectTypeOf(mutation.error).toEqualTypeOf<Signal<null>>()
    }
  })

  test('data should be undefined when mutation is pending', () => {
    const mutation = injectMutation(() => ({
      mutationFn: () => sleep(0).then(() => 'string'),
    }))

    if (mutation.isPending()) {
      expectTypeOf(mutation.data).toEqualTypeOf<Signal<undefined>>()
    }
  })

  test('error should be defined when mutation is error', () => {
    const mutation = injectMutation(() => ({
      mutationFn: () => sleep(0).then(() => 'string'),
    }))

    if (mutation.isError()) {
      expectTypeOf(mutation.error).toEqualTypeOf<Signal<Error>>()
    }
  })

  test('should narrow variables', () => {
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
    expectTypeOf(mutation.variables).toEqualTypeOf<Signal<string | undefined>>()
  })
})
