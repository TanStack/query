import { render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import { serverConfig } from './services/todos/api'
import { todosMutations, todosQueries } from './services/todos/queries'
import type { Todo } from './services/todos/types'
import type { TargetedEvent } from 'preact'
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
  return (event: TargetedEvent<HTMLInputElement>) => {
    const value = event.currentTarget.valueAsNumber
    if (!Number.isNaN(value)) {
      setValue(value)
    }
  }
}

function Root() {
  const [staleTime, setStaleTime] = useState(initialStaleTime)
  const [gcTime, setGcTime] = useState(initialGcTime)
  const [localErrorRate, setLocalErrorRate] = useState(serverConfig.errorRate)
  const [localFetchTimeMin, setLocalFetchTimeMin] = useState(
    serverConfig.queryTimeMin,
  )
  const [localFetchTimeMax, setLocalFetchTimeMax] = useState(
    serverConfig.queryTimeMax,
  )

  useEffect(() => {
    serverConfig.errorRate = localErrorRate
    serverConfig.queryTimeMin = localFetchTimeMin
    serverConfig.queryTimeMax = localFetchTimeMax
  }, [localErrorRate, localFetchTimeMax, localFetchTimeMin])

  useEffect(() => {
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
          onInput={onNumberChange(setStaleTime)}
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
          onInput={onNumberChange(setGcTime)}
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
          onInput={onNumberChange(setLocalErrorRate)}
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
          onInput={onNumberChange(setLocalFetchTimeMin)}
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
          onInput={onNumberChange(setLocalFetchTimeMax)}
          style={{ width: '60px' }}
        />
      </div>
      <br />
      <App />
      <br />
      <PreactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}

function App() {
  const queryClient = useQueryClient()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [views, setViews] = useState(['', 'fruit', 'grape'])

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
  setEditingIndex: (editingIndex: number | null) => void
}) {
  const [filter, setFilter] = useState(initialFilter)

  const { status, data, isFetching, error, failureCount, refetch } = useQuery(
    todosQueries.list(filter),
  )

  return (
    <div>
      <div>
        <label>
          Filter:{' '}
          <input
            value={filter}
            onInput={(e) => setFilter(e.currentTarget.value)}
          />
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
  setEditingIndex: (editingIndex: number | null) => void
}) {
  const queryClient = useQueryClient()

  const { status, data, isFetching, failureCount, refetch } = useQuery(
    todosQueries.detail(editingIndex),
  )

  const [draft, setDraft] = useState<Partial<Omit<Todo, 'id'>>>({})

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
              onInput={(e) =>
                setDraft((old) => ({ ...old, name: e.currentTarget.value }))
              }
              disabled={disableEditSave}
            />
          </label>
          <label>
            Notes:{' '}
            <input
              value={draft.notes ?? data.notes}
              onInput={(e) =>
                setDraft((old) => ({ ...old, notes: e.currentTarget.value }))
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
  const [name, setName] = useState('')

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
        onInput={(e) => setName(e.currentTarget.value)}
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
render(<Root />, rootElement)
