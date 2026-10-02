import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, onServerPrefetch } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { computed, isVue3 } from 'vue-demi'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { useQuery } from '../useQuery'

vi.mock('../useQueryClient')

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
      const key = queryKey()

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
