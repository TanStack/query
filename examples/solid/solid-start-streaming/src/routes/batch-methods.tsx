import { notifyManager, useQuery } from '@tanstack/solid-query'
import { createSignal } from 'solid-js'
import { QueryBoundary } from '~/components/query-boundary'

function sleep(milliseconds: number) {
  return new Promise((res) => setTimeout(res, milliseconds))
}

function spin(milliseconds: number) {
  const start = performance.now()
  while (performance.now() - start <= milliseconds) {
    // do nothing
  }
}

async function sayHello(name: string) {
  console.info('[api] sayHello.start')

  await sleep(500)

  // make the layout shift more obvious, it doesn't always happen
  console.time('[api] sayHello.spin')
  spin(20)
  console.timeEnd('[api] sayHello.spin')

  console.info('[api] sayHello.end')
  return `Hello ${name}`
}

export default function BatchMethods() {
  const [count, setCount] = createSignal(0)

  const hello = useQuery(() => ({
    queryKey: ['hello', count()] as const,
    queryFn: ({ queryKey: [_, count] }) => sayHello(`solid ${count}`),
  }))

  return (
    <div>
      <select
        value="timer"
        ref={(el) => (el.value = 'timer')} // browser caches form input
        onInput={(e) => {
          const type = e.currentTarget.value
          if (type === 'raf') notifyManager.setScheduler(requestAnimationFrame)
          if (type === 'tick') notifyManager.setScheduler(queueMicrotask)
          if (type === 'timer')
            notifyManager.setScheduler((cb) => setTimeout(cb, 0))
        }}
      >
        <option value="raf">requestAnimationFrame</option>
        <option value="timer">setTimeout</option>
        <option value="tick">queueMicrotick</option>
      </select>
      <button class="increment" onClick={() => setCount((x) => x + 1)}>
        Clicks: {count()}
      </button>
      <p>
        <QueryBoundary loadingFallback={'Loading...'} query={hello}>
          {(data) => <div style={{ 'background-color': 'aqua' }}>{data}</div>}
        </QueryBoundary>
      </p>
      <div style={{ 'background-color': 'red' }}>
        Something below to demonstrate layout shift
      </div>
      <p>
        Due to the way solidjs handles updates, sometimes the updating of a
        query results in DOM modifications triggering a rerender twice. This is
        perceived as a glitch in the layout of the webpage that usually lasts
        for one frame. By using another batching strategy in the browser,
        instead of the default setTimeout one, we can mitigate this issue. Try
        out requestAnimationFrame or queueMicrotick.
      </p>
    </div>
  )
}
