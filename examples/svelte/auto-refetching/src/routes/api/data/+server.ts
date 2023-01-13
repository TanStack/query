import { json, type RequestHandler } from '@sveltejs/kit'

let list = { items: ['Item 1', 'Item 2', 'Item 3'] }

/** @type {import('./$types').RequestHandler} */
export const GET: RequestHandler = async ({ url }) => {
  const add = url.searchParams.get('add')
  const clear = url.searchParams.get('clear')

  if (add) {
    if (!list.items.includes(add)) {
      list.items.push(add)
    }
  } else if (clear) {
    list.items = []
  }
  await new Promise((r) => setTimeout(r, 1000))
  return json(list, { status: 200 })
}
