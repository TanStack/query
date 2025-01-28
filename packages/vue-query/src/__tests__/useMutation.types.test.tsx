import { reactive } from 'vue'
import { useMutation } from '../useMutation'
import {
  type Equal,
  type Expect,
  doNotExecute,
  successMutator,
} from './test-utils'

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

  it('data should be undefined when mutation is loading', () => {
    doNotExecute(() => {
      const mutation = reactive(
        useMutation({ mutationFn: successMutator<string> }),
      )

      if (mutation.isLoading) {
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
        const result: Expect<Equal<unknown, typeof mutation.error>> = true
        return result
      }
      return
    })
  })
})
