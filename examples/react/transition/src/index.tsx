import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { Suspense, use, useState, useTransition } from 'react'
import ReactDOM from 'react-dom/client'

const Example1 = ({ value }: { value: number }) => {
  const { isFetching, promise } = useQuery({
    queryKey: ['1' + value],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return '1' + value
    },
  })
  const data = use(promise)

  return (
    <div>
      {data} {isFetching ? 'fetching' : null}
    </div>
  )
}

const Example2 = ({ value }: { value: number }) => {
  const { promise, isFetching } = useQuery({
    queryKey: ['2' + value],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return '2' + value
    },
    // placeholderData: keepPreviousData,
  })

  const data = use(promise)

  return (
    <div>
      {data} {isFetching ? 'fetching' : null}
    </div>
  )
}

const SuspenseBoundary = () => {
  const [state, setState] = useState(-1)
  const [isPending, startTransition] = useTransition()

  return (
    <div>
      <h1>Change state with transition</h1>
      <div>
        <button
          onClick={() =>
            startTransition(() => {
              setState((s) => s - 1)
            })
          }
        >
          Decrease
        </button>
      </div>
      <h2>State:</h2>
      <ul>
        <li>last state value: {state}</li>
        <li>
          transition state: {isPending ? <strong>pending</strong> : 'idle'}
        </li>
      </ul>
      <h2>2. 1 Suspense + startTransition</h2>
      <Suspense fallback="fallback 1">
        <Example1 value={state}></Example1>
      </Suspense>
      <h2>2.2 Suspense + startTransition</h2>
      <Suspense fallback="fallback 2">
        <Example2 value={state}></Example2>
      </Suspense>
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      experimental_prefetchInRender: true,
      staleTime: 10 * 1000,
    },
  },
})

const App = () => {
  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <SuspenseBoundary />
      </QueryClientProvider>
    </div>
  )
}

const rootElement = document.getElementById('root') as HTMLElement
ReactDOM.createRoot(rootElement).render(<App />)
