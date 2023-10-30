import { describe, it } from 'vitest'
import { reactive } from 'vue-demi'
import { useMutation } from '../useMutation'
import { doNotExecute, successMutator } from './test-utils'
import type { Equal, Expect } from './test-utils'

describe('Discriminated union return type', () => {
  it('data should be possibly undefined by default', () => {
    doNotExecute(() => {
      const mutation = reactive(
        useMutation({ mutationFn: successMutator<string> }),
      )

      const result: Expect<Equal<string | undefined, typeof mutation.data>> =
        true
      return result
    })
  })

  it('data should be defined when mutation is success', () => {
    doNotExecute(() => {
      const mutation = reactive(
        useMutation({ mutationFn: successMutator<string> }),
      )

      if (mutation.isSuccess) {
        const result: Expect<Equal<string, typeof mutation.data>> = true
        return result
      }
      return
    })
  })

  it('error should be null when mutation is success', () => {
    doNotExecute(() => {
      const mutation = reactive(
        useMutation({ mutationFn: successMutator<string> }),
      )

      if (mutation.isSuccess) {
        const result: Expect<Equal<null, typeof mutation.error>> = true
        return result
      }
      return
    })
  })

  it('data should be undefined when mutation is pending', () => {
    doNotExecute(() => {
      const mutation = reactive(
        useMutation({ mutationFn: successMutator<string> }),
      )

      if (mutation.isPending) {
        const result: Expect<Equal<undefined, typeof mutation.data>> = true
        return result
      }
      return
    })
  })

  it('error should be defined when mutation is error', () => {
    doNotExecute(() => {
      const mutation = reactive(
        useMutation({ mutationFn: successMutator<string> }),
      )

      if (mutation.isError) {
        const result: Expect<Equal<Error, typeof mutation.error>> = true
        return result
      }
      return
    })
  })

  it('should narrow variables', () => {
    doNotExecute(() => {
      const mutation = reactive(
        useMutation({ mutationFn: successMutator<string> }),
      )

      if (mutation.isIdle) {
        const result: Expect<Equal<undefined, typeof mutation.variables>> = true
        return result
      }
      if (mutation.isPending) {
        const result: Expect<Equal<string, typeof mutation.variables>> = true
        return result
      }
      if (mutation.isSuccess) {
        const result: Expect<Equal<string, typeof mutation.variables>> = true
        return result
      }
      const result: Expect<Equal<string, typeof mutation.variables>> = true
      return result
    })
  })
})
