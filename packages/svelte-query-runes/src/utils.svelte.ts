export function createMemo<T>(fn: () => T) {
  const data = $derived(fn())
  return () => data
}
export function derive<T>(fn: T) {
  const data = $derived(fn())
  return () => data
}
export function log(...arg) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...arg)
  }
}
export function on() {}

export function createResource<T, U>(
  fetcher: (
    k: U,
    info: { value: T | undefined; refetching: boolean | unknown },
  ) => Promise<T>,
) {
  const s = $state({ data: null, error: null, isLoading: true })

  const c = (...arg) => {
    s.isLoading = true
    fetcher(...arg)
      .then((v) => {
        s.data = v
      })
      .catch((v) => {
        s.error = v
      })
      .finally(() => {
        s.isLoading = false
      })
  }
  return [
    () => s.data,
    {
      mutate: (fn: T | (() => T)) => {
        s.data = typeof fn == 'function' ? fn() : fn
      },
      refetch: c,
    },
  ] as const
}
