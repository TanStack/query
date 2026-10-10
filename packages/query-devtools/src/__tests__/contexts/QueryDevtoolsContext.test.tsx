import { describe, expect, it } from 'vitest'
import { render } from '@solidjs/testing-library'
import { createEffect, createSignal } from 'solid-js'
import { QueryClient, onlineManager } from '@tanstack/query-core'
import { QueryDevtoolsContext, useQueryDevtoolsContext } from '../../contexts'

describe('QueryDevtoolsContext', () => {
  it('should reflect updates when the "Provider" value exposes a reactive getter', () => {
    const initialClient = new QueryClient()
    const nextClient = new QueryClient()
    const [client, setClient] = createSignal(initialClient)
    const observed: Array<QueryClient> = []
    function ContextProbe() {
      const ctx = useQueryDevtoolsContext()
      createEffect(() => {
        observed.push(ctx.client)
      })
      return null
    }

    render(() => (
      <QueryDevtoolsContext.Provider
        value={{
          queryFlavor: 'TanStack Query',
          version: '5',
          onlineManager,
          get client() {
            return client()
          },
        }}
      >
        <ContextProbe />
      </QueryDevtoolsContext.Provider>
    ))

    expect(observed).toEqual([initialClient])

    setClient(nextClient)
    expect(observed).toEqual([initialClient, nextClient])

    initialClient.clear()
    nextClient.clear()
  })
})
