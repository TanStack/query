import type { Todo, Todos } from './types'
import {
  errorRate,
  queryTimeMax,
  queryTimeMin,
  ref,
  snapshot,
} from '$lib/stores.svelte'

let initialId = 0
const initialList: Todos = [
  'apple',
  'banana',
  'pineapple',
  'grapefruit',
  'dragonfruit',
  'grapes',
].map((d) => ({ id: initialId++, name: d, notes: 'These are some notes' }))

const list = ref(initialList)
const nextId = ref(initialId)

export const todosAPI = {
  getTodos: async ({ filter }: { filter: string }): Promise<Todos> => {
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < errorRate.value) {
            return reject(
              new Error(JSON.stringify({ fetchTodos: { filter } }, null, 2)),
            )
          }
          resolve(list.value.filter((d) => d.name.includes(filter)))
        },
        queryTimeMin.value +
          Math.random() * (queryTimeMax.value - queryTimeMin.value),
      )
    })
  },
  getTodo: async ({ id }: { id: number }): Promise<Todo> => {
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < errorRate.value) {
            return reject(
              new Error(JSON.stringify({ fetchTodoById: { id } }, null, 2)),
            )
          }
          const todo = snapshot(list.value.find((d) => d.id === id))
          if (!todo) {
            return reject(
              new Error(JSON.stringify({ fetchTodoById: { id } }, null, 2)),
            )
          }
          resolve(todo)
        },
        queryTimeMin.value +
          Math.random() * (queryTimeMax.value - queryTimeMin.value),
      )
    })
  },
  createTodo: async ({ name, notes }: Omit<Todo, 'id'>): Promise<Todo> => {
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < errorRate.value) {
            return reject(
              new Error(
                JSON.stringify(
                  { postTodo: { name: snapshot(name), notes } },
                  null,
                  2,
                ),
              ),
            )
          }
          const todo = { name, notes, id: nextId.value }
          nextId.value = nextId.value + 1
          list.value.push(todo)
          resolve(todo)
        },
        queryTimeMin.value +
          Math.random() * (queryTimeMax.value - queryTimeMin.value),
      )
    })
  },
  updateTodo: (todo: Todo): Promise<Todo> => {
    console.info('patchTodo', todo)
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < errorRate.value) {
            return reject(
              new Error(JSON.stringify({ patchTodo: todo }, null, 2)),
            )
          }
          list.value = list.value.map((d) => {
            if (d.id === todo.id) {
              return snapshot(todo)
            }
            return d
          })
          resolve(todo)
        },
        queryTimeMin.value +
          Math.random() * (queryTimeMax.value - queryTimeMin.value),
      )
    })
  },
}
