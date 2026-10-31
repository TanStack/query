import type { Todo, Todos } from './types'

let nextId = 0
let list = [
  'apple',
  'banana',
  'pineapple',
  'grapefruit',
  'dragonfruit',
  'grapes',
].map((d) => ({ id: nextId++, name: d, notes: 'These are some notes' }))

export const serverConfig = {
  errorRate: 0.05,
  queryTimeMin: 1000,
  queryTimeMax: 2000,
}

export const todosAPI = {
  getTodos: ({
    filter,
    signal,
  }: {
    filter: string
    signal: AbortSignal
  }): Promise<Todos> => {
    console.info('getTodos', { filter })

    signal.addEventListener('abort', () => {
      console.info('cancelled', filter)
    })

    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < serverConfig.errorRate) {
            return reject(
              new Error(JSON.stringify({ getTodos: { filter } }, null, 2)),
            )
          }
          resolve(list.filter((d) => d.name.includes(filter)))
        },
        serverConfig.queryTimeMin +
          Math.random() *
            (serverConfig.queryTimeMax - serverConfig.queryTimeMin),
      )
    })
  },
  getTodo: ({ id }: { id: number }): Promise<Todo> => {
    console.info('getTodo', { id })
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < serverConfig.errorRate) {
            return reject(
              new Error(JSON.stringify({ getTodo: { id } }, null, 2)),
            )
          }
          const todo = list.find((d) => d.id === id)
          if (!todo) {
            return reject(new Error(`Todo with id ${id} not found`))
          }
          resolve(todo)
        },
        serverConfig.queryTimeMin +
          Math.random() *
            (serverConfig.queryTimeMax - serverConfig.queryTimeMin),
      )
    })
  },
  createTodo: ({ name, notes }: Omit<Todo, 'id'>): Promise<Todo> => {
    console.info('createTodo', { name, notes })
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < serverConfig.errorRate) {
            return reject(
              new Error(
                JSON.stringify({ createTodo: { name, notes } }, null, 2),
              ),
            )
          }
          const todo = { name, notes, id: nextId++ }
          list = [...list, todo]
          resolve(todo)
        },
        serverConfig.queryTimeMin +
          Math.random() *
            (serverConfig.queryTimeMax - serverConfig.queryTimeMin),
      )
    })
  },
  updateTodo: (todo: Todo): Promise<Todo> => {
    console.info('updateTodo', todo)
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.random() < serverConfig.errorRate) {
            return reject(
              new Error(JSON.stringify({ updateTodo: todo }, null, 2)),
            )
          }
          list = list.map((d) => {
            if (d.id === todo.id) {
              return todo
            }
            return d
          })
          resolve(todo)
        },
        serverConfig.queryTimeMin +
          Math.random() *
            (serverConfig.queryTimeMax - serverConfig.queryTimeMin),
      )
    })
  },
}
