import { describe, expect, it } from 'vitest'
import { Show } from 'solid-js'
import { render } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider, useQuery } from '..'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('cache observer events', () => {
  it('should mount a child query once when it lives under a Show gated on a parent query', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
      },
    })
    let mounts = 0
    const options = () => ({
      queryKey: ['observer-remount'],
      queryFn: () => wait(10).then(() => 1),
    })

    function Child() {
      mounts++
      if (mounts > 20) throw new Error('remount loop')
      useQuery(options)
      return <p>child</p>
    }

    function Page() {
      const query = useQuery(options)
      return (
        <Show when={query.data}>
          <Child />
        </Show>
      )
    }

    const { unmount } = render(() => (
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    ))

    await wait(100)
    unmount()

    expect(mounts).toBe(1)
  })
})
