export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout)
  })
}

let queryKeyCount = 0

export function queryKey(): string {
  queryKeyCount += 1
  return `query_${queryKeyCount}`
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
