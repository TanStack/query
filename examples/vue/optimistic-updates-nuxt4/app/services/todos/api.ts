import type { Todo } from './types'

export const todosAPI = {
  getTodos: (): Promise<Array<Todo>> => $fetch('/api/todos'),
  createTodo: (text: string): Promise<Todo> =>
    $fetch('/api/todos', { method: 'POST', body: { text } }).catch(
      (error: { data?: { message?: string }; message: string }) => {
        throw new Error(error.data?.message ?? error.message)
      },
    ),
}
