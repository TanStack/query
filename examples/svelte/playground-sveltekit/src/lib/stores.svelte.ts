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

export function snapshot<T>(value: T) {
  return $state.snapshot(value)
}

export const staleTime = ref(1000)
export const gcTime = ref(3000)
export const errorRate = ref(0.05)
export const queryTimeMin = ref(1000)
export const queryTimeMax = ref(2000)

export const editingIndex = ref<number | null>(null)
export const views = ref(['', 'fruit', 'grape'])
