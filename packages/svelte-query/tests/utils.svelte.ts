export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout)
  })
}

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
