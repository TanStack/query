import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, onServerPrefetch } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { computed, isVue3 } from 'vue-demi'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { useQuery } from '../useQuery'
import { VueQueryPlugin } from '../vueQueryPlugin'
import { QueryClient } from '../queryClient'

vi.mock(import('../useQueryClient'))

describe('Server Side Rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.runIf(isVue3)(
    'should resolve a dependent query whose queryKey changed before suspense in onServerPrefetch',
    async () => {
      const key = createKey()

      const App = defineComponent({
        setup() {
          const first = useQuery({
            queryKey: [...key, 'first'],
            queryFn: () => sleep(10).then(() => 1),
          })
          const id = first.data
          const second = useQuery({
            queryKey: [...key, 'second', id],
            queryFn: () => sleep(10).then(() => `second-${id.value}`),
            enabled: computed(() => !!id.value),
          })

          onServerPrefetch(async () => {
            await first.suspense()
            await second.suspense()
          })

          return () => h('div', `data: ${second.data.value}`)
        },
      })

      const htmlPromise = renderToString(createSSRApp(App))
      await vi.advanceTimersByTimeAsync(20)
      await expect(htmlPromise).resolves.toBe('<div>data: second-1</div>')
    },
  )
})

describe('SSR Memory Leak Prevention', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should dispose QueryClient and clear all caches after request', async () => {
    const key = createKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    const App = defineComponent({
      setup() {
        const query = useQuery({
          queryKey: [...key, 'test'],
          queryFn,
        })

        onServerPrefetch(async () => {
          await query.suspense()
        })

        return () => h('div', query.data.value || 'loading')
      },
    })

    const app = createSSRApp(App)
    app.use(VueQueryPlugin)

    // Render the app
    const htmlPromise = renderToString(app)
    await vi.advanceTimersByTimeAsync(20)
    await htmlPromise

    // Verify the query was executed
    expect(queryFn).toHaveBeenCalledTimes(1)

    // Get the client from the app
    const client = app.$queryClient
    expect(client).toBeDefined()

    // Check that queries exist before disposal
    expect(client.getQueryCache().findAll().length).toBeGreaterThan(0)

    // Call dispose (this is what SSR frameworks should call)
    app.$queryClientDispose()

    // Verify all caches are cleared
    expect(client.getQueryCache().findAll().length).toBe(0)
    expect(client.getMutationCache().findAll().length).toBe(0)

    // Verify client is unmounted
    expect(client.isMounted()).toBe(false)
  })

  it('should handle multiple requests without memory leak', async () => {
    const key = createKey()
    let requestCount = 0

    const createAppWithQuery = () => {
      const queryFn = vi.fn(() => {
        requestCount++
        return sleep(5).then(() => `data-${requestCount}`)
      })

      const App = defineComponent({
        setup() {
          const query = useQuery({
            queryKey: [...key, 'multi', requestCount],
            queryFn,
          })

          onServerPrefetch(async () => {
            await query.suspense()
          })

          return () => h('div', query.data.value || 'loading')
        },
      })

      return { App, queryFn }
    }

    // Simulate 5 SSR requests
    for (let i = 0; i < 5; i++) {
      const { App, queryFn } = createAppWithQuery()
      const app = createSSRApp(App)
      app.use(VueQueryPlugin)

      const htmlPromise = renderToString(app)
      await vi.advanceTimersByTimeAsync(10)
      await htmlPromise

      // Verify query executed
      expect(queryFn).toHaveBeenCalledTimes(1)

      // Dispose after each request
      const client = app.$queryClient
      app.$queryClientDispose()

      // Verify cache is cleared
      expect(client.getQueryCache().findAll().length).toBe(0)
    }

    // Total queries should be 5 (one per request)
    expect(requestCount).toBe(5)
  })
})