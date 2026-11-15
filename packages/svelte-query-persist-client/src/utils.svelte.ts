type Box<T> = { current: T }

/**
 * Creates a reactive box: an object whose `current` property is backed by `$state`.
 * @param initial - The initial value of `current`.
 * @returns An object whose `current` property reads and writes the state.
 */
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
