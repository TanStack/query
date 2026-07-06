import { QueryClient } from '@tanstack/query-core'
import { createQueryController } from '../dist/index.js'

class TestControllerHost {
  controllers = new Set()
  updatesRequested = 0
  updateComplete = Promise.resolve(true)

  addController(controller) {
    this.controllers.add(controller)
  }

  removeController(controller) {
    this.controllers.delete(controller)
  }

  requestUpdate() {
    this.updatesRequested += 1
  }

  connect() {
    for (const controller of this.controllers) {
      controller.hostConnected?.()
    }
  }

  disconnect() {
    for (const controller of this.controllers) {
      controller.hostDisconnected?.()
    }
  }

  update() {
    for (const controller of this.controllers) {
      controller.hostUpdate?.()
    }

    for (const controller of this.controllers) {
      controller.hostUpdated?.()
    }
  }
}

async function waitFor(assertion, timeoutMs = 3000) {
  const startedAt = Date.now()
  while (!assertion()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Timed out waiting for assertion after ${timeoutMs}ms`)
    }
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
}

async function run(cycles = 1000) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  const queryKey = ['l3-stress']
  const startedAt = Date.now()
  const initialHeapMb = process.memoryUsage().heapUsed / (1024 * 1024)

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    const host = new TestControllerHost()
    const query = createQueryController(
      host,
      {
        queryKey,
        gcTime: 0,
        queryFn: async () => cycle,
      },
      client,
    )

    host.connect()
    host.update()
    await waitFor(() => query().isSuccess, 4000)

    const cacheQuery = client.getQueryCache().find({ queryKey })
    const connectedCount = cacheQuery?.getObserversCount() ?? 0
    if (connectedCount !== 1) {
      throw new Error(
        `observer_count_connected_invalid:${connectedCount}:cycle:${cycle}`,
      )
    }

    host.disconnect()
    query.destroy()

    const disconnectedCount = cacheQuery?.getObserversCount() ?? 0
    if (disconnectedCount !== 0) {
      throw new Error(
        `observer_count_disconnected_invalid:${disconnectedCount}:cycle:${cycle}`,
      )
    }
  }

  const elapsedMs = Date.now() - startedAt
  const finalHeapMb = process.memoryUsage().heapUsed / (1024 * 1024)
  const memoryGrowthMb = Number((finalHeapMb - initialHeapMb).toFixed(3))

  const summary = {
    measuredAt: new Date().toISOString(),
    cycles,
    elapsedMs,
    initialHeapMb: Number(initialHeapMb.toFixed(3)),
    finalHeapMb: Number(finalHeapMb.toFixed(3)),
    memoryGrowthMb,
    retainedObserversAfterRun:
      client.getQueryCache().find({ queryKey })?.getObserversCount() ?? 0,
  }

  console.log(JSON.stringify(summary, null, 2))
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
