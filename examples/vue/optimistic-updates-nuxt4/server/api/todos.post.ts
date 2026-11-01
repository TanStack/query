import type { Todo } from '../../app/services/todos/types'

export default defineEventHandler(async (event) => {
  const body: unknown = await readBody(event).catch(() => null)

  const text =
    body !== null &&
    typeof body === 'object' &&
    'text' in body &&
    typeof body.text === 'string'
      ? body.text.trim()
      : ''

  if (!text) {
    throw createError({ statusCode: 400, message: 'text is required' })
  }

  await new Promise((resolve) => setTimeout(resolve, 500))

  if (Math.random() < 0.3) {
    throw createError({
      statusCode: 500,
      message: 'Server error — please try again',
    })
  }

  const newTodo: Todo = {
    id: crypto.randomUUID(),
    text,
    createdAt: Date.now(),
  }

  todos.push(newTodo)

  setResponseStatus(event, 201)
  return newTodo
})
