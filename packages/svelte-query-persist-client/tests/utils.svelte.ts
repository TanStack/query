import { QueryClient } from '@tanstack/svelte-query'

import type { QueryClientConfig } from '@tanstack/svelte-query'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config)
}

export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout)
  })
}

export type StatusResult<T = unknown> = {
  status: string
  fetchStatus: string
  data: T | undefined
}

export function ref<T>(initial: T) {
  let value = $state(initial)

  return {
    get value() {
      return value
    },
    set value(newValue) {
      value = newValue
    },
  }
}
