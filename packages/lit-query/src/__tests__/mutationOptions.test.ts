import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { sleep } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { createMutationController } from '../createMutationController.js'
import { mutationOptions } from '../mutationOptions.js'
import { generateElementName } from './utils.js'

describe('mutationOptions', () => {
  let queryClient: QueryClient
  let container: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(() => {
    container.remove()
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should work when passed to createMutationController', async () => {
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        mutationOptions({
          mutationFn: (value: number) => sleep(10).then(() => value + 10),
        }),
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation

    const mutatePromise = mutation.mutateAsync(5)
    await vi.advanceTimersByTimeAsync(10)
    await expect(mutatePromise).resolves.toBe(15)
    expect(mutation().isSuccess).toBe(true)
  })
})
