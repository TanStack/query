import { notifyManager, replaceEqualDeep } from '@tanstack/query-core'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'octane'
import { resolveClient } from './context'
import { splitSlot, subSlot } from './internal'
import type {
  Mutation,
  MutationFilters,
  MutationState,
  QueryClient,
} from '@tanstack/query-core'

// Per upstream useMutationState.ts (kept module-private there too).
type MutationStateOptions<TResult = MutationState> = {
  filters?: MutationFilters
  select?: (mutation: Mutation) => TResult
}

function getResult(mutationCache: any, options: any): Array<any> {
  return mutationCache
    .findAll(options.filters)
    .map((mutation: any) =>
      options.select ? options.select(mutation) : mutation.state,
    )
}

// Signatures match @tanstack/react-query's useMutationState.ts.
export function useMutationState<TResult = MutationState>(
  options?: MutationStateOptions<TResult>,
  queryClient?: QueryClient,
): Array<TResult>

export function useMutationState(...args: Array<any>): Array<any> {
  const [user, slot] = splitSlot(args)
  const options = user[0] ?? {}
  const mutationCache = resolveClient(user[1]).getMutationCache()

  const optionsRef = useRef(options, subSlot(slot, 'ms:opt'))
  const result = useRef<Array<any> | null>(null, subSlot(slot, 'ms:res'))
  if (result.current === null) {
    result.current = getResult(mutationCache, options)
  }
  useEffect(
    () => {
      optionsRef.current = options
    },
    undefined,
    subSlot(slot, 'ms:eff'),
  )

  return useSyncExternalStore(
    useCallback(
      (onStoreChange: () => void) =>
        mutationCache.subscribe(() => {
          const next = replaceEqualDeep(
            result.current,
            getResult(mutationCache, optionsRef.current),
          )
          if (result.current !== next) {
            result.current = next
            notifyManager.schedule(onStoreChange)
          }
        }),
      [mutationCache],
      subSlot(slot, 'ms:cb'),
    ),
    () => result.current as Array<any>,
    () => result.current as Array<any>,
    subSlot(slot, 'ms:uses'),
  )
}

// Signature matches @tanstack/react-query's useMutationState.ts.
export function useIsMutating(
  filters?: MutationFilters,
  queryClient?: QueryClient,
): number

export function useIsMutating(...args: Array<any>): number {
  const [user, slot] = splitSlot(args)
  const filters = user[0]
  const client = resolveClient(user[1])
  // Forward this hook's slot to useMutationState (it owns the base hooks).
  return (useMutationState as (...a: Array<any>) => Array<any>)(
    { filters: { ...filters, status: 'pending' } },
    client,
    slot,
  ).length
}
