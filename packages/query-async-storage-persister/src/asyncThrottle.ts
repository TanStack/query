export interface AsyncThrottleOptions {
  interval?: number
  onError?: (error: unknown) => void
}

const noop = () => {
  /* do nothing */
}

export function asyncThrottle<Args extends ReadonlyArray<unknown>>(
  func: (...args: Args) => Promise<void>,
  { interval = 1000, onError = noop }: AsyncThrottleOptions = {},
) {
  if (typeof func !== 'function') throw new Error('argument is not function.')

  let running = false
  let lastTime = 0
  let timeout: ReturnType<typeof setTimeout>
  let currentArgs: Args | null = null

  const execFunc = async () => {
    if (currentArgs) {
      const args = currentArgs
      currentArgs = null
      try {
        running = true
        await func(...args)
      } catch (error) {
        onError(error)
      } finally {
        lastTime = Date.now() // this line must after 'func' executed to avoid two 'func' running in concurrent.
        running = false
      }
    }
  }

  const delayFunc = async () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      if (running) {
        delayFunc() // Will come here when 'func' execution time is greater than the interval.
      } else {
        execFunc()
      }
    }, interval)
  }

  return (...args: Args) => {
    currentArgs = args

    const tooSoon = Date.now() - lastTime < interval
    if (running || tooSoon) {
      delayFunc()
    } else {
      execFunc()
    }
  }
}
