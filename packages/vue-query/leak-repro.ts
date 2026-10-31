import { createSSRApp, defineComponent, h, onServerPrefetch } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { sleep } from '@tanstack/query-test-utils'

/**
 * SSR Memory Leak Reproduction Script
 * 
 * This script demonstrates the memory leak fix for Vue Query in SSR environments.
 * Run with: node --expose-gc -r tsx/cjs leak-repro.ts
 * 
 * The test simulates multiple SSR requests and verifies that memory
 * is properly released after each request when dispose() is called.
 */

async function simulateRequest(requestId: number) {
  const key = ['test', requestId]
  
  const App = defineComponent({
    setup() {
      const query = useQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => `data-${requestId}`),
      })

      onServerPrefetch(async () => {
        await query.suspense()
      })

      return () => h('div', query.data.value || 'loading')
    },
  })

  const app = createSSRApp(App)
  app.use(VueQueryPlugin)

  const htmlPromise = renderToString(app)
  await htmlPromise

  // Get the client and verify it has queries
  const client = app.$queryClient
  const queriesBeforeDispose = client.getQueryCache().findAll().length
  console.log(`Request ${requestId}: ${queriesBeforeDispose} queries in cache before dispose`)

  // THE FIX: Call dispose to clear everything
  app.$queryClientDispose()

  const queriesAfterDispose = client.getQueryCache().findAll().length
  console.log(`Request ${requestId}: ${queriesAfterDispose} queries in cache after dispose`)

  return { queriesBeforeDispose, queriesAfterDispose }
}

async function runTest() {
  console.log('🚀 Starting SSR Memory Leak Test...\n')
  
  const results = []
  const iterations = 10

  for (let i = 0; i < iterations; i++) {
    const result = await simulateRequest(i + 1)
    results.push(result)
  }

  console.log('\n--- Test Results ---')
  const allCleared = results.every(r => r.queriesAfterDispose === 0)
  
  if (allCleared) {
    console.log('✅ SUCCESS: All queries properly disposed after each request!')
    console.log('✅ No memory leak detected.')
  } else {
    console.log('❌ FAILURE: Memory leak detected!')
    results.forEach((r, i) => {
      if (r.queriesAfterDispose > 0) {
        console.log(`  Request ${i + 1}: ${r.queriesAfterDispose} queries leaked`)
      }
    })
  }
  
  process.exit(allCleared ? 0 : 1)
}

runTest().catch(console.error)