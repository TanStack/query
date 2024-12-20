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
      await new Promise((resolve) => setTimeout(resolve, 2000))
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
      await new Promise((resolve) => setTimeout(resolve, 2000))
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
  console.log({ isPending })
  return (
    <div>
      <h1>Change state with transition</h1>
      <div>
        State: {isPending ? 'in transition' : state}{' '}
        <button
          onClick={() =>
            startTransition(() => {
              setState((s) => s - 1)
            })
          }
        >
          Decrease
        </button>{' '}
        (last state value: {state})
      </div>
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
