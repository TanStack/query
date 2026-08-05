import { describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider, useQuery } from '..'
import type * as SolidWeb from 'solid-js/web'
import type { UseQueryResult } from '..'

// Force the server code path: on the server `useBaseQuery` enables
// `experimental_prefetchInRender` and resolves the resource with a
// serializable `hydratableObserverResult()`.
vi.mock('solid-js/web', async (importOriginal) => {
  const mod = await importOriginal<typeof SolidWeb>()
  return { ...mod, isServer: true }
})

describe('useQuery on the server', () => {
  it('resolves a disabled query without leaking the prefetch promise (#10907)', async () => {
    const client = new QueryClient()
    let state: UseQueryResult<string> | undefined

    function Page() {
      const query = useQuery(() => ({
        queryKey: ['disabled-ssr'],
        queryFn: () => Promise.resolve('data'),
        enabled: false,
      }))
      state = query
      return <div>data: {String(query.data)}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => rendered.getByText('data: undefined'))

    // The resolved result is serialized into the SSR payload, so it must not
    // carry functions or promises. The `experimental_prefetchInRender`
    // promise of a disabled query never settles, which would hang
    // `renderToStringAsync` while the serializer awaits it.
    expect(state!.refetch).toBeUndefined()
    expect(state!.promise).toBeUndefined()
  })

  it('resolves an enabled query with data and without unserializable fields', async () => {
    const client = new QueryClient()
    let state: UseQueryResult<string> | undefined

    function Page() {
      const query = useQuery(() => ({
        queryKey: ['enabled-ssr'],
        queryFn: () => Promise.resolve('server data'),
      }))
      state = query
      return <div>data: {String(query.data)}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => rendered.getByText('data: server data'))

    expect(state!.data).toBe('server data')
    expect(state!.isSuccess).toBe(true)
    expect(state!.refetch).toBeUndefined()
    expect(state!.promise).toBeUndefined()
  })
})
