import {
  createEffect,
  createOptimistic,
  createSignal,
  onCleanup,
  sharedConfig,
  untrack,
} from 'solid-js'
import type { Accessor } from 'solid-js'

const isServer = typeof window === 'undefined'

/**
 * Shared reactive core for the cross-cache aggregate hooks — `useIsFetching`,
 * `useIsMutating`, `useMutationState` — which all reduce to "a value derived
 * from a whole cache, refreshed on its events". Two invariants live here so
 * each hook doesn't restate them:
 *
 * Dual write. Cache events can fire inside an action transaction
 * (`useMutation` rides core `action`; an onSuccess invalidation dispatches
 * refetches mid-action), where a plain signal write is held until settle —
 * the in-flight value would be invisible. An optimistic override alone fails
 * the other way: outside a transaction, overrides drop at batch end. So a
 * durable signal carries committed state and an optimistic node tracks it as
 * its base; in-transaction values surface through the override, and the held
 * durable write becomes the base when the settle lands.
 *
 * Hydration. A cross-cache aggregate is not tied to a single async source,
 * so it cannot ride the boundary contract per-query meta uses (suspend until
 * settled). Its contract is fixed by construction instead: a hydrating
 * client can only ever observe the empty value at claim time — its own
 * fetches are held inside the hydration window, channel-primed entries are
 * settled, and mutations do not transfer across SSR. So the server
 * serializes the empty value, and a hydrated mount latches there until its
 * window closes: the subscription and first sync run from an effect half,
 * deferred past hydration — the earliest globally-safe moment for a
 * cross-cache read to go live (on a streamed page, an already-hydrated
 * region's refetch can be in flight while this region is still claiming).
 *
 * Every node here is created on the server too, where it is never read or
 * written: hydration id assignment is positional, so both sides must create
 * the same reactive nodes or every id downstream shifts and the subtree
 * key-misses.
 */
export function createCacheAggregate<T>(
  subscribe: (onEvent: () => void) => () => void,
  read: (prev: T) => T,
  empty: T,
): Accessor<T> {
  const hydratedMount =
    !isServer && (sharedConfig as { hydrating?: boolean }).hydrating === true

  // Cast: createSignal's value overload excludes functions (a function
  // argument means a compute); aggregate values are counts and arrays.
  const [durable, setDurable] = createSignal<T>(
    (hydratedMount || isServer ? empty : untrack(() => read(empty))) as Exclude<
      T,
      Function
    >,
    { ownedWrite: true },
  )
  const [value, setValue] = createOptimistic(() => durable(), {
    ownedWrite: true,
  })

  const sync = () => {
    const next = untrack(() => read(untrack(durable)))
    setDurable(() => next)
    setValue(() => next)
  }
  let unsubscribe: (() => void) | null = null
  const attach = () => {
    unsubscribe ??= untrack(() => subscribe(sync))
  }
  onCleanup(() => unsubscribe?.())

  createEffect(
    () => undefined,
    () => {
      if (hydratedMount) {
        attach()
        sync()
      }
    },
  )

  if (isServer) return () => empty
  if (!hydratedMount) attach()
  return value
}
