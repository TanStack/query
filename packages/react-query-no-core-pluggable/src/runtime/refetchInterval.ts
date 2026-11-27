import { isServer } from './environmentManager'
import { focusManager } from './focusManager'
import { timeoutManager } from './timeoutManager'
import { isValidTimeout } from './utils'

interface PollingTimer {
  query: object
  delay: number
  stop: () => void
}

interface PollingObserver<TQuery> {
  getCurrentQuery: () => TQuery
  hasListeners: () => boolean
  options: {
    enabled?: boolean | ((query: TQuery) => boolean)
    refetchIntervalInBackground?: boolean
  }
}

type Delay = number | false | undefined

/** An observer option created by {@link refetchInterval}. */
interface RefetchInterval<TQuery> {
  value: Delay | ((query: TQuery) => Delay)
  update: typeof updatePolling
}

/**
 * Polls an observed query after the specified delay in milliseconds.
 * @param value - A delay or a callback that selects the delay for the current query.
 * Returning zero, false or undefined stops the timer.
 * @returns A polling option for a query hook or client defaults.
 * @example
 * ```ts
 * useQuery({ queryKey: ['orders'], queryFn: fetchOrders, refetchInterval: refetchInterval(3000) })
 * ```
 */
export function refetchInterval(value: Delay): RefetchInterval<object>
export function refetchInterval<TQuery extends object>(
  value: Delay | ((query: TQuery) => Delay),
): RefetchInterval<TQuery>
export function refetchInterval<TQuery extends object>(
  value: Delay | ((query: TQuery) => Delay),
): RefetchInterval<TQuery> {
  return { value, update: updatePolling }
}

/**
 * Reconciles one observer's timer with its current options and cached query.
 * @param observer - Observer receiving the optional schedule.
 * @param current - Timer installed during the preceding update.
 * @param restart - Restarts the countdown after a query update or subscription.
 * @param fetch - Refetches the observer's current query.
 * @returns The active timer and its cleanup, when polling is enabled.
 */
function updatePolling<TQuery extends object>(
  this: RefetchInterval<TQuery>,
  observer: PollingObserver<TQuery>,
  current: PollingTimer | undefined,
  restart: boolean,
  fetch: () => void,
): PollingTimer | undefined {
  const query = observer.getCurrentQuery()
  const { value } = this
  const delay = typeof value === 'function' ? value(query) : value
  if (!observer.hasListeners()) return

  const { enabled } = observer.options
  if (
    isServer() ||
    !isValidTimeout(delay) ||
    delay === 0 ||
    (typeof enabled === 'function' ? enabled(query) : enabled) === false
  ) {
    current?.stop()
    return
  }
  if (!restart && current?.query === query && current.delay === delay) {
    return current
  }
  current?.stop()
  const id = timeoutManager.setInterval(() => {
    if (
      observer.options.refetchIntervalInBackground ||
      focusManager.isFocused()
    ) {
      fetch()
    }
  }, delay)

  return { query, delay, stop: () => timeoutManager.clearInterval(id) }
}

export type { PollingTimer, RefetchInterval }
