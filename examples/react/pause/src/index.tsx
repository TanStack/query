import ReactDOM from 'react-dom/client'
import {
  PauseManager,
  PauseManagerProvider,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { memo, useRef, useSyncExternalStore } from 'react'

const queryClient = new QueryClient()
const pauseManager = new PauseManager(true)

let counter = 1

const useCounter = () =>
  useQuery({
    queryKey: ['counter'],
    refetchOnMount: false,
    queryFn: () => counter++,
  })

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <Example />
    </QueryClientProvider>
  )
}

function Example() {
  const { data, refetch } = useCounter()
  const isPaused = useSyncExternalStore(
    (onStoreChange) => pauseManager.subscribe(onStoreChange),
    () => pauseManager.isPaused(),
  )

  return (
    <div>
      <p>Parent Counter: {data}</p>
      <div style={{ opacity: isPaused ? 0.5 : 1 }}>
        <PauseManagerProvider pauseManager={pauseManager}>
          <MemoisedChild />
        </PauseManagerProvider>
      </div>
      <button onClick={() => refetch()}>Increment</button>
      <button onClick={() => pauseManager.setPaused(!isPaused)}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  )
}

const MemoisedChild = memo(() => {
  const { data } = useCounter()
  const renders = useRef(0)
  renders.current++

  return (
    <>
      <p>Child counter: {data}</p>
      <p>Child renders: {renders.current}</p>
    </>
  )
})

const rootElement = document.getElementById('root') as HTMLElement
ReactDOM.createRoot(rootElement).render(<App />)
