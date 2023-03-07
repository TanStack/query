import { writable } from 'svelte/store'

export const staleTime = writable(1000)
export const gcTime = writable(3000)
export const errorRate = writable(0.05)
export const queryTimeMin = writable(1000)
export const queryTimeMax = writable(2000)

export const editingIndex = writable<number | null>(null)
export const views = writable(['', 'fruit', 'grape'])

let initialId = 0
const initialList = [
  'apple',
  'banana',
  'pineapple',
  'grapefruit',
  'dragonfruit',
  'grapes',
].map((d) => ({ id: initialId++, name: d, notes: 'These are some notes' }))

export const list = writable(initialList)
export const id = writable(initialId)
