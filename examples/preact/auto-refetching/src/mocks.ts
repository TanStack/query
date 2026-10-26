import { HttpResponse, delay, http } from 'msw'
import { setupWorker } from 'msw/browser'

const storageKey = 'auto-refetching-list'

const getList = (): Array<string> =>
  JSON.parse(localStorage.getItem(storageKey) ?? 'null') ?? [
    'Item 1',
    'Item 2',
    'Item 3',
  ]

const setList = (list: Array<string>) =>
  localStorage.setItem(storageKey, JSON.stringify(list))

// an simple endpoint for getting current list
export const worker = setupWorker(
  http.get('/api/data', async ({ request }) => {
    const { searchParams } = new URL(request.url)
    const add = searchParams.get('add')
    const clear = searchParams.get('clear')

    const list = getList()

    if (add) {
      if (!list.includes(add)) {
        setList([...list, add])
      }
    } else if (clear) {
      setList([])
    }

    await delay(100)

    return HttpResponse.json(getList())
  }),
)
