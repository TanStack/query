type Box<T> = { current: T }

export function box<T>(initial: T): Box<T> {
  let current = $state(initial)

  return {
    get current() {
      return current
    },
    set current(newValue) {
      current = newValue
    },
  }
}
