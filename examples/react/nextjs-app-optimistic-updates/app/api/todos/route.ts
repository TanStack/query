import { NextResponse } from 'next/server'
import { todos, getTodos, type Todo } from './data'

export async function GET() {
  return NextResponse.json(await getTodos())
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const text =
    body !== null &&
    typeof body === 'object' &&
    'text' in body &&
    typeof (body as { text: unknown }).text === 'string'
      ? ((body as { text: string }).text.trim())
      : ''

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  await new Promise((resolve) => setTimeout(resolve, 500))

  if (Math.random() < 0.3) {
    return NextResponse.json(
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

  return NextResponse.json(newTodo, { status: 201 })
}
