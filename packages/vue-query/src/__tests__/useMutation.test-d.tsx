import { describe, expectTypeOf, it } from 'vitest'
import { reactive } from 'vue-demi'
import { sleep } from '@tanstack/query-test-utils'
import { useMutation } from '../useMutation'

describe('Discriminated union return type', () => {
  it('data should be possibly undefined by default', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      }),
    )

    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>()
  })

  it('data should be defined when mutation is success', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      }),
    )

    if (mutation.isSuccess) {
      expectTypeOf(mutation.data).toEqualTypeOf<string>()
    }
  })

  it('error should be null when mutation is success', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      }),
    )

    if (mutation.isSuccess) {
      expectTypeOf(mutation.error).toEqualTypeOf<null>()
    }
  })

  it('data should be undefined when mutation is pending', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      }),
    )

    if (mutation.isPending) {
      expectTypeOf(mutation.data).toEqualTypeOf<undefined>()
    }
  })

  it('error should be defined when mutation is error', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      }),
    )

    if (mutation.isError) {
      expectTypeOf(mutation.error).toEqualTypeOf<Error>()
    }
  })

  it('should narrow variables', () => {
    const mutation = reactive(
      useMutation({
        mutationFn: (params: string) => sleep(0).then(() => params),
      }),
    )

    if (mutation.isIdle) {
      expectTypeOf(mutation.variables).toEqualTypeOf<undefined>()
      return
    }
    if (mutation.isPending) {
      expectTypeOf(mutation.variables).toEqualTypeOf<string>()
      return
    }
    if (mutation.isSuccess) {
      expectTypeOf(mutation.variables).toEqualTypeOf<string>()
      return
    }
    expectTypeOf(mutation.variables).toEqualTypeOf<string>()
  })
})
