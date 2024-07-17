import { describe, expectTypeOf } from 'vitest'
import { injectQuery } from '..'
import { simpleFetcher } from './test-utils'
import type { Signal } from '@angular/core'

describe('Discriminated union return type', () => {
  test('data should be possibly undefined by default', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: simpleFetcher,
    }))

    expectTypeOf(query.data).toEqualTypeOf<Signal<string | undefined>>()
  })

  test('data should be defined when query is success', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: simpleFetcher,
    }))

    if (query.isSuccess()) {
      expectTypeOf(query.data).toEqualTypeOf<Signal<string>>()
    }
  })

  test('error should be null when query is success', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: simpleFetcher,
    }))

    if (query.isSuccess()) {
      expectTypeOf(query.error).toEqualTypeOf<Signal<null>>()
    }
  })

  test('data should be undefined when query is pending', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: simpleFetcher,
    }))

    if (query.isPending()) {
      expectTypeOf(query.data).toEqualTypeOf<Signal<undefined>>()
    }
  })

  test('error should be defined when query is error', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      queryFn: simpleFetcher,
    }))

    if (query.isError()) {
      expectTypeOf(query.error).toEqualTypeOf<Signal<Error>>()
    }
  })
})
