import { vi } from 'vitest'
import { onlineManager } from '..'
import * as utils from '../utils'
import type { MockInstance } from 'vitest'
import type { MutationOptions, QueryClient } from '..'

export function mockOnlineManagerIsOnline(
  value: boolean,
): MockInstance<() => boolean> {
  return vi.spyOn(onlineManager, 'isOnline').mockReturnValue(value)
}

export function executeMutation<TVariables>(
  queryClient: QueryClient,
  options: MutationOptions<any, any, TVariables, any>,
  variables: TVariables,
) {
  return queryClient
    .getMutationCache()
    .create(queryClient, options)
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
