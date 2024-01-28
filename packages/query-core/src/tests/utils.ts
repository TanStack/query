import { vi } from 'vitest'
import { QueryClient, onlineManager } from '..'
import * as utils from '../utils'
import type { SpyInstance } from 'vitest'
import type { MutationOptions, QueryClientConfig } from '..'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config)
}

export function mockVisibilityState(
  value: DocumentVisibilityState,
): SpyInstance<[], DocumentVisibilityState> {
  return vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(value)
}

export function mockOnlineManagerIsOnline(
  value: boolean,
): SpyInstance<[], boolean> {
  return vi.spyOn(onlineManager, 'isOnline').mockReturnValue(value)
}

let queryKeyCount = 0
export function queryKey(): Array<string> {
  queryKeyCount++
  return [`query_${queryKeyCount}`]
}

export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout)
  })
}

export const executeMutation = <TVariables>(
  queryClient: QueryClient,
  options: MutationOptions<any, any, TVariables, any>,
  variables: TVariables,
) => {
  return queryClient
    .getMutationCache()
    .build(queryClient, options)
    .execute(variables)
}

// This monkey-patches the isServer-value from utils,
// so that we can pretend to be in a server environment
export function setIsServer(isServer: boolean) {
  const original = utils.isServer
  Object.defineProperty(utils, 'isServer', {
    get: () => isServer,
  })

  return () => {
    Object.defineProperty(utils, 'isServer', {
      get: () => original,
    })
  }
}

export const doNotExecute = (_func: () => void) => true

export type Equal<TTargetA, TTargetB> = (<T>() => T extends TTargetA
  ? 1
  : 2) extends <T>() => T extends TTargetB ? 1 : 2
  ? true
  : false

export type Expect<T extends true> = T
