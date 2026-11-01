import { HttpResponse, delay, http } from 'msw'
import { setupWorker } from 'msw/browser'
import type { Todo } from './services/todos/types'

const todos: Array<Todo> = [
  {
    id: crypto.randomUUID(),
    text: 'Buy groceries',
    createdAt: Date.now() - 3000,
  },
  {
    id: crypto.randomUUID(),
    text: 'Walk the dog',
    createdAt: Date.now() - 2000,
  },
  {
    id: crypto.randomUUID(),
    text: 'Read a book',
    createdAt: Date.now() - 1000,
  },
]

export const worker = setupWorker(
  http.get('/api/todos', async () => {
    await delay(200)
    return HttpResponse.json(todos)
  }),

  http.post('/api/todos', async ({ request }) => {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return HttpResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const text =
      body !== null &&
      typeof body === 'object' &&
      'text' in body &&
      typeof body.text === 'string'
        ? body.text.trim()
        : ''

    if (!text) {
      return HttpResponse.json({ error: 'text is required' }, { status: 400 })
    }

    await delay(500)

    if (Math.random() < 0.3) {
      return HttpResponse.json(
        { error: 'Server error — please try again' },
        { status: 500 },
      )
    }

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      createdAt: Date.now(),
    }

    todos.push(newTodo)

    return HttpResponse.json(newTodo, { status: 201 })
  }),
)
