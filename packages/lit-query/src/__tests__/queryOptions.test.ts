import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { createQueryController } from '../createQueryController.js'
import { queryOptions } from '../queryOptions.js'
import { generateElementName } from './utils.js'

describe('queryOptions', () => {
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

  it('should work when passed to createQueryController', async () => {
    const key = queryKey()

    class Host extends LitElement {
      readonly query = createQueryController(
        this,
        queryOptions({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'query-ok'),
        }),
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const query = host.query

    await vi.advanceTimersByTimeAsync(10)
    expect(query().isSuccess).toBe(true)
    expect(query().data).toBe('query-ok')
  })
})
