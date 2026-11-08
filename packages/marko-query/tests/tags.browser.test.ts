import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, dehydrate } from '@tanstack/marko-query'
import Boundary from './fixtures/boundary-fixture.marko'
import Fetching from './fixtures/fetching-fixture.marko'
import Infinite from './fixtures/infinite-fixture.marko'
import Mutation from './fixtures/mutation-fixture.marko'
import Queries from './fixtures/queries-fixture.marko'
import { container, createClient, expectText, sleep, text } from './utils.js'

describe('marko-query tags', () => {
  let root: HTMLElement
  let instance: { destroy: () => void } | undefined

  afterEach(() => {
    instance?.destroy()
    instance = undefined
    root.remove()
  })

  function mount<TInput>(
    template: {
      mount: (input: TInput, root: Element) => { destroy: () => void }
    },
    input: TInput,
  ) {
    root = container()
    instance = template.mount(input, root)
  }

  describe('<infinite-query>', () => {
    it('fetches pages on demand', async () => {
      mount(Infinite, { client: createClient() })
      await expectText(root, 'pages', '[0]')
      root.querySelector<HTMLButtonElement>('#more')!.click()
      await expectText(root, 'pages', '[0,10]')
      root.querySelector<HTMLButtonElement>('#more')!.click()
      await expectText(root, 'pages', '[0,10,20]')
      await expectText(root, 'has-next', 'false')
    })
  })

  describe('<queries>', () => {
    it('returns one result per query, or what combine returns', async () => {
      const client = createClient()
      mount(Queries, { client, ids: [1, 2] })
      await expectText(root, 'statuses', 'success,success')
      await expectText(root, 'joined', 'item 1,item 2')
      await expectText(root, 'pending', 'false')
      const spy = vi.spyOn(client, 'getQueryCache')
      root.querySelector<HTMLButtonElement>('#refetch-first')!.click()
      await expect
        .poll(() => client.getQueryState(['item', 1])?.dataUpdateCount, {
          timeout: 2_000,
          interval: 10,
        })
        .toBe(2)
      expect(client.getQueryState(['item', 2])?.dataUpdateCount).toBe(1)
      spy.mockRestore()
    })
  })

  describe('<mutation>, <is-mutating>, <mutation-state>', () => {
    it('mutate reports through the result and per-call callbacks', async () => {
      const log: Array<string> = []
      const client = createClient()
      mount(Mutation, {
        client,
        log,
        mutationFn: (value: number) => sleep(60).then(() => value * 2),
      })
      await expectText(root, 'status', 'idle')
      root.querySelector<HTMLButtonElement>('#save')!.click()
      await expectText(root, 'status', 'pending')
      await expectText(root, 'count', '1')
      await expectText(root, 'states', 'pending')
      await expectText(root, 'status', 'success')
      await expectText(root, 'data', '4')
      await expectText(root, 'count', '0')
      await expectText(root, 'states', 'success')
      expect(log).toStrictEqual(['success 4', 'settled'])
      root.querySelector<HTMLButtonElement>('#reset')!.click()
      await expectText(root, 'status', 'idle')
    })

    it('mutateAsync rejects; mutate does not', async () => {
      const log: Array<string> = []
      mount(Mutation, {
        client: createClient(),
        log,
        mutationFn: (value: number) => {
          if (value < 0) return Promise.reject(new Error('negative'))
          return Promise.resolve(value)
        },
      })
      root.querySelector<HTMLButtonElement>('#save-async')!.click()
      await expect
        .poll(() => log.join(), { timeout: 2_000, interval: 10 })
        .toBe('rejected negative')
      await expectText(root, 'error', 'negative')
    })

    it('throwOnError throws to the nearest <try>', async () => {
      mount(Mutation, {
        client: createClient(),
        log: [],
        throwOnError: true,
        mutationFn: async () => Promise.reject(new Error('nope')),
      })
      root.querySelector<HTMLButtonElement>('#save')!.click()
      await expectText(root, 'caught', 'nope')
    })
  })

  describe('<is-fetching>', () => {
    it('counts fetching queries, with filters', async () => {
      const client = createClient()
      mount(Fetching, { client })
      await expectText(root, 'all', '0')
      void client.query({
        queryKey: ['slow'],
        queryFn: () => sleep(60).then(() => 1),
      })
      void client.query({
        queryKey: ['fast'],
        queryFn: () => sleep(40).then(() => 1),
      })
      await expectText(root, 'all', '2')
      await expectText(root, 'slow', '1')
      await expectText(root, 'all', '0')
      await expectText(root, 'slow', '0')
    })
  })

  describe('<hydration-boundary>', () => {
    it('hydrates before its content renders', async () => {
      const source = new QueryClient()
      source.setQueryData(['boundary'], 'from server')
      const client = createClient()
      mount(Boundary, { client, state: dehydrate(source) })
      await expectText(root, 'data', 'from server')
    })

    it('hydrates newer state passed later', async () => {
      const source = new QueryClient()
      source.setQueryData(['boundary'], 'first')
      const client = createClient()
      root = container()
      const view = Boundary.mount({ client, state: dehydrate(source) }, root)
      instance = view
      await expectText(root, 'data', 'first')
      source.setQueryData(['boundary'], 'second', {
        updatedAt: Date.now() + 1000,
      })
      view.update({ client, state: dehydrate(source) })
      await expectText(root, 'data', 'second')
      expect(client.getQueryData(['boundary'])).toBe('second')
    })
  })
})
