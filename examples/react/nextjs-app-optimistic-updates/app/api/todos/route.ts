import { NextResponse } from 'next/server'

export interface Todo {
  id: string
  text: string
  createdAt: number
}

export const todos: Array<Todo> = [
  { id: crypto.randomUUID(), text: 'Buy groceries', createdAt: Date.now() - 3000 },
  { id: crypto.randomUUID(), text: 'Walk the dog', createdAt: Date.now() - 2000 },
  { id: crypto.randomUUID(), text: 'Read a book', createdAt: Date.now() - 1000 },
]

export async function getTodos(): Promise<Array<Todo>> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return todos
}

export async function GET() {
  return NextResponse.json(await getTodos())
}

export async function POST(request: Request) {
  const body = (await request.json()) as { text: string }

  await new Promise((resolve) => setTimeout(resolve, 500))

  if (Math.random() < 0.3) {
    return NextResponse.json(
      { error: 'Server error — please try again' },
      { status: 500 },
    )
  }

  const newTodo: Todo = {
    id: crypto.randomUUID(),
    text: body.text,
    createdAt: Date.now(),
  }

  todos.push(newTodo)

  return NextResponse.json(newTodo, { status: 201 })
}
