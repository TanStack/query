import { getQueryClient, noop } from '@tanstack/marko-query'
import { createTodo } from '../../lib/api.ts'
import { todosQueryOptions } from '../../lib/queries.ts'

export const GET = Run.GET(async (context, next) => {
  await getQueryClient(context).query(todosQueryOptions).catch(noop)
  return next({ error: '' })
})

export const POST = Run.POST(
  {
    form(value) {
      return {
        title: typeof value.title === 'string' ? value.title.trim() : '',
      }
    },
  },
  async (context, next) => {
    const body = await context.body
    if (!body.title) {
      await getQueryClient(context).query(todosQueryOptions).catch(noop)
      return next({ error: 'Title is required.' })
    }
    await createTodo(body.title)
    return context.redirect('/form-mutation', 303)
  },
)
