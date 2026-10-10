/**
 * Waits for a number of milliseconds, e.g. to delay a `queryFn` under fake timers.
 * @param ms - How long to wait, in milliseconds.
 * @returns A promise that resolves after `ms` milliseconds.
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
