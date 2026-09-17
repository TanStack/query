/**
 * SSR entry for the disabled-query regression test.
 *
 * A transcription of the reproduction from the issue: no boundary, one
 * provider, one disabled query whose `.data` is read during render. A
 * disabled query has nothing in flight and nothing cached, so the read has
 * nothing to wait on and the stream has to finish. The absence of a
 * boundary is the point — a regression must not be able to hide by parking
 * inside one.
 *
 * Reports `finished: false` on a timeout instead of hanging, so a
 * regression surfaces as an assertion rather than an unsettled top-level
 * await.
 */
import { renderToStream } from '@solidjs/web'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/solid-query'

const RENDER_TIMEOUT = 8000

let fetches = 0

function Disabled() {
  const query = useQuery(() => ({
    queryKey: ['disabled'],
    queryFn: () => {
      fetches++
      return Promise.resolve('data')
    },
    enabled: false,
  }))
  return (
    <div id="out">
      {String(query.data)}|{query.status}|{String(query.isEnabled)}
    </div>
  )
}

const client = new QueryClient()

const result = await new Promise<{ finished: boolean; html: string }>(
  (resolve) => {
    let html = ''
    const timer = setTimeout(
      () => resolve({ finished: false, html }),
      RENDER_TIMEOUT,
    )
    renderToStream(() => (
      <QueryClientProvider client={client}>
        <Disabled />
      </QueryClientProvider>
    )).pipe({
      write(payload: string) {
        html += payload
      },
      end() {
        clearTimeout(timer)
        resolve({ finished: true, html })
      },
    })
  },
)

console.log(JSON.stringify({ ...result, fetches }))
// A parked render leaves handles open; exit rather than wait them out.
process.exit(0)
