import { describe, expectTypeOf } from 'vitest'
import { interval, map, take } from 'rxjs'
import { injectQuery } from '../inject-query'
import { simpleFetcher } from './test-utils'
import type { Signal } from '@angular/core'

function simpleObservable() {
  return interval(1000).pipe(
    map((_, i) => `Some data ${i}`),
    take(5),
  )
}

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

  test('data should be infered from a passed in observable', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      query$: () => simpleObservable(),
    }))

    expectTypeOf(query.data).toEqualTypeOf<Signal<string | undefined>>()
  })

  test('data should still be defined when query is successful', () => {
    const query = injectQuery(() => ({
      queryKey: ['key'],
      query$: () => simpleObservable(),
    }))

    if (query.isSuccess()) {
      expectTypeOf(query.data).toEqualTypeOf<Signal<string>>()
    }
  })
})
