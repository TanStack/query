import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { serverConfig } from './services/todos/api'
import { todosMutations, todosQueries } from './services/todos/queries'
import type { Todo } from './services/todos/types'
import './styles.css'

const initialStaleTime = 1000
const initialGcTime = 3000

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: initialStaleTime,
      gcTime: initialGcTime,
    },
  },
})

function onNumberChange(setValue: (value: number) => void) {
  return (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.valueAsNumber
    if (!Number.isNaN(value)) {
      setValue(value)
    }
  }
}

function Root() {
  const [staleTime, setStaleTime] = React.useState(initialStaleTime)
  const [gcTime, setGcTime] = React.useState(initialGcTime)
  const [localErrorRate, setLocalErrorRate] = React.useState(
    serverConfig.errorRate,
  )
  const [localFetchTimeMin, setLocalFetchTimeMin] = React.useState(
    serverConfig.queryTimeMin,
  )
  const [localFetchTimeMax, setLocalFetchTimeMax] = React.useState(
    serverConfig.queryTimeMax,
  )

  React.useEffect(() => {
    serverConfig.errorRate = localErrorRate
    serverConfig.queryTimeMin = localFetchTimeMin
    serverConfig.queryTimeMax = localFetchTimeMax
  }, [localErrorRate, localFetchTimeMax, localFetchTimeMin])

  React.useEffect(() => {
    queryClient.setDefaultOptions({
      queries: {
        staleTime,
        gcTime,
      },
    })
  }, [gcTime, staleTime])

  return (
    <QueryClientProvider client={queryClient}>
      <p>
        The "staleTime" and "gcTime" durations have been altered in this example
        to show how query stale-ness and query caching work on a granular level
      </p>
      <div>
        Stale Time:{' '}
        <input
          type="number"
          min="0"
          step="1000"
          defaultValue={staleTime}
          onChange={onNumberChange(setStaleTime)}
          style={{ width: '100px' }}
        />
      </div>
      <div>
        Garbage collection Time:{' '}
        <input
          type="number"
          min="0"
          step="1000"
          defaultValue={gcTime}
          onChange={onNumberChange(setGcTime)}
          style={{ width: '100px' }}
        />
      </div>
      <br />
      <div>
        Error Rate:{' '}
        <input
          type="number"
          min="0"
          max="1"
          step=".05"
          defaultValue={localErrorRate}
          onChange={onNumberChange(setLocalErrorRate)}
          style={{ width: '100px' }}
        />
      </div>
      <div>
        Fetch Time Min:{' '}
        <input
          type="number"
          min="1"
          step="500"
          defaultValue={localFetchTimeMin}
          onChange={onNumberChange(setLocalFetchTimeMin)}
          style={{ width: '60px' }}
        />{' '}
      </div>
      <div>
        Fetch Time Max:{' '}
        <input
          type="number"
          min="1"
          step="500"
          defaultValue={localFetchTimeMax}
          onChange={onNumberChange(setLocalFetchTimeMax)}
          style={{ width: '60px' }}
        />
      </div>
      <br />
      <App />
      <br />
      <ReactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}

function App() {
  const queryClient = useQueryClient()
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [views, setViews] = React.useState(['', 'fruit', 'grape'])

  return (
    <div className="App">
      <div>
        <button onClick={() => queryClient.invalidateQueries()}>
          Force Refetch All
        </button>
      </div>
      <br />
      <hr />
      {views.map((view, index) => (
        <div key={index}>
          <Todos initialFilter={view} setEditingIndex={setEditingIndex} />
          <br />
        </div>
      ))}
      <button
        onClick={() => {
          setViews((old) => [...old, ''])
        }}
      >
        Add Filter List
      </button>
      <hr />
      {editingIndex !== null ? (
        <>
          <EditTodo
            key={editingIndex}
            editingIndex={editingIndex}
            setEditingIndex={setEditingIndex}
          />
          <hr />
        </>
      ) : null}
      <AddTodo />
    </div>
  )
}

function Todos({
  initialFilter = '',
  setEditingIndex,
}: {
  initialFilter: string
  setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>
}) {
  const [filter, setFilter] = React.useState(initialFilter)

  const { status, data, isFetching, error, failureCount, refetch } = useQuery(
    todosQueries.list(filter),
  )

  return (
    <div>
      <div>
        <label>
          Filter:{' '}
          <input value={filter} onChange={(e) => setFilter(e.target.value)} />
        </label>
      </div>
      {status === 'pending' ? (
        <span>Loading... (Attempt: {failureCount + 1})</span>
      ) : status === 'error' ? (
        <span>
          Error: {error.message}
          <br />
          <button onClick={() => refetch()}>Retry</button>
        </span>
      ) : (
        <>
          <ul>
            {data.map((todo) => (
              <li key={todo.id}>
                {todo.name}{' '}
                <button onClick={() => setEditingIndex(todo.id)}>Edit</button>
              </li>
            ))}
          </ul>
          <div>
            {isFetching ? (
              <span>
                Background Refreshing... (Attempt: {failureCount + 1})
              </span>
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function EditTodo({
  editingIndex,
  setEditingIndex,
}: {
  editingIndex: number
  setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>
}) {
  const queryClient = useQueryClient()

  const { status, data, isFetching, failureCount, refetch } = useQuery(
    todosQueries.detail(editingIndex),
  )

  const [draft, setDraft] = React.useState<Partial<Omit<Todo, 'id'>>>({})

  const saveMutation = useMutation({
    ...todosMutations.update(),
    onSuccess: (todo) => {
      // Update `todos` and the individual todo queries when this mutation succeeds
      queryClient.invalidateQueries({ queryKey: todosQueries.lists() })
      queryClient.setQueryData(todosQueries.detail(editingIndex).queryKey, todo)
      setDraft({})
    },
  })

  const disableEditSave =
    status === 'pending' || saveMutation.status === 'pending'

  return (
    <div>
      <div>
        {data ? (
          <>
            <button onClick={() => setEditingIndex(null)}>Back</button> Editing
            Todo "{data.name}" (#
            {editingIndex})
          </>
        ) : null}
      </div>
      {status === 'pending' ? (
        <span>Loading... (Attempt: {failureCount + 1})</span>
      ) : status === 'error' ? (
        <span>
          Error! <button onClick={() => refetch()}>Retry</button>
        </span>
      ) : (
        <>
          <label>
            Name:{' '}
            <input
              value={draft.name ?? data.name}
              onChange={(e) =>
                setDraft((old) => ({ ...old, name: e.target.value }))
              }
              disabled={disableEditSave}
            />
          </label>
          <label>
            Notes:{' '}
            <input
              value={draft.notes ?? data.notes}
              onChange={(e) =>
                setDraft((old) => ({ ...old, notes: e.target.value }))
              }
              disabled={disableEditSave}
            />
          </label>
          <div>
            <button
              onClick={() => saveMutation.mutate({ ...data, ...draft })}
              disabled={disableEditSave}
            >
              Save
            </button>
          </div>
          <div>
            {saveMutation.status === 'pending'
              ? 'Saving...'
              : saveMutation.status === 'error'
                ? saveMutation.error.message
                : saveMutation.status === 'success'
                  ? 'Saved!'
                  : null}
          </div>
          <div>
            {isFetching ? (
              <span>
                Background Refreshing... (Attempt: {failureCount + 1})
              </span>
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function AddTodo() {
  const queryClient = useQueryClient()
  const [name, setName] = React.useState('')

  const addMutation = useMutation({
    ...todosMutations.create(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todosQueries.lists() })
    },
  })

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={addMutation.status === 'pending'}
      />
      <button
        onClick={() => {
          addMutation.mutate({ name, notes: 'These are some notes' })
        }}
        disabled={addMutation.status === 'pending' || !name}
      >
        Add Todo
      </button>
      <div>
        {addMutation.status === 'pending'
          ? 'Saving...'
          : addMutation.status === 'error'
            ? addMutation.error.message
            : addMutation.status === 'success'
              ? 'Saved!'
              : null}
      </div>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
ReactDOM.createRoot(rootElement).render(<Root />)
