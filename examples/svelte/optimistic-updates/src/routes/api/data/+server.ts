import { json } from '@sveltejs/kit'
import type { RequestHandler } from '@sveltejs/kit'

type Todo = {
  id: string
  text: string
}

const items: Array<Todo> = []

/** @type {import('./$types').RequestHandler} */
export const GET: RequestHandler = async (req) => {
  await new Promise((r) => setTimeout(r, 1000))
  return json({ ts: Date.now(), items }, { status: 200 })
}

/** @type {import('./$types').RequestHandler} */
export const POST: RequestHandler = async ({ request }) => {
  const { text } = await request.json()

  if (Math.random() > 0.7) {
    json({ message: 'Could not add item!' }, { status: 500 })
  }
  const newTodo = {
    id: Math.random().toString(),
    text: text.toUpperCase() as string,
  }
  items.push(newTodo)
  return json(newTodo, { status: 200 })
}
