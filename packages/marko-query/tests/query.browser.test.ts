import { afterEach, describe, expect, it, vi } from 'vitest'
import Fixture from './fixtures/query-fixture.marko'
import { container, createClient, expectText, text } from './utils.js'

describe('<query> in the browser', () => {
  let root: HTMLElement
  let instance: { destroy: () => void } | undefined

  afterEach(() => {
    instance?.destroy()
    root.remove()
  })

  function mount(
    input: Omit<Parameters<typeof Fixture.mount>[0], 'client' | 'queryKey'>,
  ) {
    const client = createClient()
    root = container()
    instance = Fixture.mount({ client, queryKey: ['q'], ...input }, root)
    return client
  }

  it('fetches, renders the result and refetches', async () => {
    const queryFn = vi.fn<() => Promise<string>>(() => Promise.resolve('a'))
    mount({ queryFn })
    await expectText(root, 'status', 'success')
    await expectText(root, 'data', '"a"')
    expect(queryFn).toHaveBeenCalledTimes(1)
    root.querySelector<HTMLButtonElement>('#refetch')!.click()
    await expect
      .poll(() => queryFn.mock.calls.length, { timeout: 2_000, interval: 10 })
      .toBe(2)
  })

  it('follows option changes', async () => {
    const queryFn = vi.fn<
      (context?: { queryKey: ReadonlyArray<unknown> }) => Promise<unknown>
    >((context) => Promise.resolve(context?.queryKey.at(-1)))
    mount({ queryFn })
    await expectText(root, 'data', '0')
    root.querySelector<HTMLButtonElement>('#next')!.click()
    await expectText(root, 'data', '1')
    await expect
      .poll(() => queryFn.mock.calls.length, { timeout: 2_000, interval: 10 })
      .toBe(2)
  })

  it('uses the cache of the given client', async () => {
    const client = createClient()
    client.setQueryData(['q', 0], 'cached')
    root = container()
    const queryFn = vi.fn<() => Promise<string>>(() => Promise.resolve('fresh'))
    instance = Fixture.mount(
      { client, queryKey: ['q'], queryFn, extra: { staleTime: Infinity } },
      root,
    )
    await expectText(root, 'data', '"cached"')
    await expect
      .poll(() => queryFn.mock.calls.length, { timeout: 100, interval: 10 })
      .toBe(0)
  })

  it('reports errors in the result', async () => {
    mount({ queryFn: async () => Promise.reject(new Error('boom')) })
    await expectText(root, 'status', 'error')
    expect(root.querySelector('#caught')).toBeNull()
  })

  it('throwOnError throws to the nearest <try>', async () => {
    mount({
      queryFn: async () => Promise.reject(new Error('boom')),
      extra: { throwOnError: true },
    })
    await expectText(root, 'caught', 'boom')
  })

  it('unsubscribes when destroyed', async () => {
    const client = mount({ queryFn: () => Promise.resolve('a') })
    await expectText(root, 'status', 'success')
    instance!.destroy()
    instance = undefined
    expect(
      client
        .getQueryCache()
        .find({ queryKey: ['q', 0] })
        ?.getObserversCount(),
    ).toBe(0)
  })
})
