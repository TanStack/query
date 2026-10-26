import { HttpResponse, delay, http } from 'msw'
import { setupWorker } from 'msw/browser'

// an simple endpoint for getting current list
let list = ['Item 1', 'Item 2', 'Item 3']

export const worker = setupWorker(
  http.get('/api/data', async ({ request }) => {
    const { searchParams } = new URL(request.url)
    const add = searchParams.get('add')
    const clear = searchParams.get('clear')

    if (add) {
      if (!list.includes(add)) {
        list.push(add)
      }
    } else if (clear) {
      list = []
    }

    await delay(100)

    return HttpResponse.json(list)
  }),
)
