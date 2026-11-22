import { vi } from 'vitest'
import { environmentManager, onlineManager } from '..'
import { Mutation } from '../mutation'
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
  return Mutation.build(queryClient, options).execute(variables)
}

export function setIsServer(value: boolean) {
  const originalIsServer = environmentManager.isServer()
  environmentManager.setIsServer(() => value)
  return () => {
    environmentManager.setIsServer(() => originalIsServer)
  }
}
