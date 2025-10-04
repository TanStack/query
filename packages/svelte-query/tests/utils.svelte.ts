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

export function promiseWithResolvers<T>() {
  let resolve: (value: T) => void
  let reject: (reason?: any) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve: resolve!, reject: reject! }
}

export function withEffectRoot(fn: () => void | Promise<void>) {
  return async () => {
    let promise: void | Promise<void> = Promise.resolve()
    const cleanup = $effect.root(() => {
      promise = fn()
    })
    await promise
    cleanup()
  }
}
