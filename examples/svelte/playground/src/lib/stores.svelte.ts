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

export const staleTime = ref(1000)
export const gcTime = ref(3000)
export const errorRate = ref(0.05)
export const queryTimeMin = ref(1000)
export const queryTimeMax = ref(2000)

export const editingIndex = ref<number | null>(null)
export const views = ref(['', 'fruit', 'grape'])

let initialId = 0
const initialList = [
  'apple',
  'banana',
  'pineapple',
  'grapefruit',
  'dragonfruit',
  'grapes',
].map((d) => ({ id: initialId++, name: d, notes: 'These are some notes' }))

export const list = ref(initialList)
export const id = ref(initialId)

export type Todos = typeof initialList
export type Todo = Todos[0]
