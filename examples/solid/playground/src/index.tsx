/* @refresh reload */
import {
  For,
  Index,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
} from 'solid-js'
import { render } from 'solid-js/web'
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { serverConfig } from './services/todos/api'
import { todosMutations, todosQueries } from './services/todos/queries'
import type { Todo } from './services/todos/types'
import type { JSX } from 'solid-js'
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

function onNumberInput(
  setValue: (value: number) => void,
): JSX.EventHandler<HTMLInputElement, InputEvent> {
  return (event) => {
    const value = event.currentTarget.valueAsNumber
    if (!Number.isNaN(value)) {
      setValue(value)
    }
  }
}

function Root() {
  const [staleTime, setStaleTime] = createSignal(initialStaleTime)
  const [gcTime, setGcTime] = createSignal(initialGcTime)
  const [localErrorRate, setLocalErrorRate] = createSignal(
    serverConfig.errorRate,
  )
  const [localFetchTimeMin, setLocalFetchTimeMin] = createSignal(
    serverConfig.queryTimeMin,
  )
  const [localFetchTimeMax, setLocalFetchTimeMax] = createSignal(
    serverConfig.queryTimeMax,
  )

  createEffect(() => {
    serverConfig.errorRate = localErrorRate()
    serverConfig.queryTimeMin = localFetchTimeMin()
    serverConfig.queryTimeMax = localFetchTimeMax()
  })

  createEffect(() => {
    queryClient.setDefaultOptions({
      queries: {
        staleTime: staleTime(),
        gcTime: gcTime(),
      },
    })
  })

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
          value={staleTime()}
          onInput={onNumberInput(setStaleTime)}
          style={{ width: '100px' }}
        />
      </div>
      <div>
        Garbage collection Time:{' '}
        <input
          type="number"
          min="0"
          step="1000"
          value={gcTime()}
          onInput={onNumberInput(setGcTime)}
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
          value={localErrorRate()}
          onInput={onNumberInput(setLocalErrorRate)}
          style={{ width: '100px' }}
        />
      </div>
      <div>
        Fetch Time Min:{' '}
        <input
          type="number"
          min="1"
          step="500"
          value={localFetchTimeMin()}
          onInput={onNumberInput(setLocalFetchTimeMin)}
          style={{ width: '60px' }}
        />{' '}
      </div>
      <div>
        Fetch Time Max:{' '}
        <input
          type="number"
          min="1"
          step="500"
          value={localFetchTimeMax()}
          onInput={onNumberInput(setLocalFetchTimeMax)}
          style={{ width: '60px' }}
        />
      </div>
      <br />
      <App />
      <br />
      <SolidQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}

function App() {
  const queryClient = useQueryClient()
  const [editingIndex, setEditingIndex] = createSignal<number | null>(null)
  const [views, setViews] = createSignal(['', 'fruit', 'grape'])
  const editing = createMemo(() => {
    const index = editingIndex()
    return index === null ? undefined : { index }
  })

  return (
    <div class="App">
      <div>
        <button onClick={() => queryClient.invalidateQueries()}>
          Force Refetch All
        </button>
      </div>
      <br />
      <hr />
      <Index each={views()}>
        {(view) => (
          <div>
            <Todos initialFilter={view()} setEditingIndex={setEditingIndex} />
            <br />
          </div>
        )}
      </Index>
      <button
        onClick={() => {
          setViews((old) => [...old, ''])
        }}
      >
        Add Filter List
      </button>
      <hr />
      <Show when={editing()} keyed>
        {({ index }) => (
          <>
            <EditTodo editingIndex={index} setEditingIndex={setEditingIndex} />
            <hr />
          </>
        )}
      </Show>
      <AddTodo />
    </div>
  )
}

function Todos(props: {
  initialFilter: string
  setEditingIndex: (editingIndex: number | null) => void
}) {
  const [filter, setFilter] = createSignal(props.initialFilter)

  const query = useQuery(() => todosQueries.list(filter()))

  return (
    <div>
      <div>
        <label>
          Filter:{' '}
          <input
            value={filter()}
            onInput={(e) => setFilter(e.currentTarget.value)}
          />
        </label>
      </div>
      <Switch>
        <Match when={query.status === 'pending'}>
          <span>Loading... (Attempt: {query.failureCount + 1})</span>
        </Match>
        <Match when={query.status === 'error'}>
          <span>
            Error: {query.error?.message}
            <br />
            <button onClick={() => query.refetch()}>Retry</button>
          </span>
        </Match>
        <Match when={query.data}>
          {(data) => (
            <>
              <ul>
                <For each={data()}>
                  {(todo) => (
                    <li>
                      {todo.name}{' '}
                      <button onClick={() => props.setEditingIndex(todo.id)}>
                        Edit
                      </button>
                    </li>
                  )}
                </For>
              </ul>
              <div>
                <Show when={query.isFetching} fallback={<span>&nbsp;</span>}>
                  <span>
                    Background Refreshing... (Attempt: {query.failureCount + 1})
                  </span>
                </Show>
              </div>
            </>
          )}
        </Match>
      </Switch>
    </div>
  )
}

function EditTodo(props: {
  editingIndex: number
  setEditingIndex: (editingIndex: number | null) => void
}) {
  const queryClient = useQueryClient()

  const query = useQuery(() => todosQueries.detail(props.editingIndex))

  const [draft, setDraft] = createSignal<Partial<Omit<Todo, 'id'>>>({})

  const saveMutation = useMutation(() => ({
    ...todosMutations.update(),
    onSuccess: (todo) => {
      // Update `todos` and the individual todo queries when this mutation succeeds
      queryClient.invalidateQueries({ queryKey: todosQueries.lists() })
      queryClient.setQueryData(
        todosQueries.detail(props.editingIndex).queryKey,
        todo,
      )
      setDraft({})
    },
  }))

  const disableEditSave = () =>
    query.status === 'pending' || saveMutation.status === 'pending'

  return (
    <div>
      <div>
        <Show when={query.data}>
          {(data) => (
            <>
              <button onClick={() => props.setEditingIndex(null)}>Back</button>{' '}
              Editing Todo "{data().name}" (#
              {props.editingIndex})
            </>
          )}
        </Show>
      </div>
      <Switch>
        <Match when={query.status === 'pending'}>
          <span>Loading... (Attempt: {query.failureCount + 1})</span>
        </Match>
        <Match when={query.status === 'error'}>
          <span>
            Error! <button onClick={() => query.refetch()}>Retry</button>
          </span>
        </Match>
        <Match when={query.data}>
          {(data) => (
            <>
              <label>
                Name:{' '}
                <input
                  value={draft().name ?? data().name}
                  onInput={(e) =>
                    setDraft((old) => ({
                      ...old,
                      name: e.currentTarget.value,
                    }))
                  }
                  disabled={disableEditSave()}
                />
              </label>
              <label>
                Notes:{' '}
                <input
                  value={draft().notes ?? data().notes}
                  onInput={(e) =>
                    setDraft((old) => ({
                      ...old,
                      notes: e.currentTarget.value,
                    }))
                  }
                  disabled={disableEditSave()}
                />
              </label>
              <div>
                <button
                  onClick={() => saveMutation.mutate({ ...data(), ...draft() })}
                  disabled={disableEditSave()}
                >
                  Save
                </button>
              </div>
              <div>
                <Switch>
                  <Match when={saveMutation.status === 'pending'}>
                    Saving...
                  </Match>
                  <Match when={saveMutation.status === 'error'}>
                    {saveMutation.error?.message}
                  </Match>
                  <Match when={saveMutation.status === 'success'}>Saved!</Match>
                </Switch>
              </div>
              <div>
                <Show when={query.isFetching} fallback={<span>&nbsp;</span>}>
                  <span>
                    Background Refreshing... (Attempt: {query.failureCount + 1})
                  </span>
                </Show>
              </div>
            </>
          )}
        </Match>
      </Switch>
    </div>
  )
}

function AddTodo() {
  const queryClient = useQueryClient()
  const [name, setName] = createSignal('')

  const addMutation = useMutation(() => ({
    ...todosMutations.create(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todosQueries.lists() })
    },
  }))

  return (
    <div>
      <input
        value={name()}
        onInput={(e) => setName(e.currentTarget.value)}
        disabled={addMutation.status === 'pending'}
      />
      <button
        onClick={() => {
          addMutation.mutate({ name: name(), notes: 'These are some notes' })
        }}
        disabled={addMutation.status === 'pending' || !name()}
      >
        Add Todo
      </button>
      <div>
        <Switch>
          <Match when={addMutation.status === 'pending'}>Saving...</Match>
          <Match when={addMutation.status === 'error'}>
            {addMutation.error?.message}
          </Match>
          <Match when={addMutation.status === 'success'}>Saved!</Match>
        </Switch>
      </div>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(() => <Root />, rootElement)
