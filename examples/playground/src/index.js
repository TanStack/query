import React from "react";
import ReactDOM from "react-dom";

import {
  ReactQueryConfigProvider,
  useQuery,
  useMutation,
  queryCache,
} from "react-query";

import { ReactQueryDevtools } from "react-query-devtools";

import "./styles.css";

let id = 0;
let list = [
  "apple",
  "banana",
  "pineapple",
  "grapefruit",
  "dragonfruit",
  "grapes",
].map((d) => ({ id: id++, name: d, notes: "These are some notes" }));

let errorRate = 0.05;
let queryTimeMin = 1000;
let queryTimeMax = 2000;

function Root() {
  const [staleTime, setStaleTime] = React.useState(1000);
  const [cacheTime, setCacheTime] = React.useState(3000);
  const [localErrorRate, setErrorRate] = React.useState(errorRate);
  const [localFetchTimeMin, setLocalFetchTimeMin] = React.useState(
    queryTimeMin
  );
  const [localFetchTimeMax, setLocalFetchTimeMax] = React.useState(
    queryTimeMax
  );

  React.useEffect(() => {
    errorRate = localErrorRate;
    queryTimeMin = localFetchTimeMin;
    queryTimeMax = localFetchTimeMax;
  }, [localErrorRate, localFetchTimeMax, localFetchTimeMin]);

  const queryConfig = React.useMemo(
    () => ({
      queries: {
        staleTime,
        cacheTime,
      },
    }),
    [cacheTime, staleTime]
  );

  return (
    <ReactQueryConfigProvider config={queryConfig}>
      <p>
        The "staleTime" and "cacheTime" durations have been altered in this
        example to show how query stale-ness and query caching work on a
        granular level
      </p>
      <div>
        Stale Time:{" "}
        <input
          type="number"
          min="0"
          step="1000"
          value={staleTime}
          onChange={(e) => setStaleTime(parseFloat(e.target.value, 10))}
          style={{ width: "100px" }}
        />
      </div>
      <div>
        Cache Time:{" "}
        <input
          type="number"
          min="0"
          step="1000"
          value={cacheTime}
          onChange={(e) => setCacheTime(parseFloat(e.target.value, 10))}
          style={{ width: "100px" }}
        />
      </div>
      <br />
      <div>
        Error Rate:{" "}
        <input
          type="number"
          min="0"
          max="1"
          step=".05"
          value={localErrorRate}
          onChange={(e) => setErrorRate(parseFloat(e.target.value, 10))}
          style={{ width: "100px" }}
        />
      </div>
      <div>
        Fetch Time Min:{" "}
        <input
          type="number"
          min="1"
          step="500"
          value={localFetchTimeMin}
          onChange={(e) => setLocalFetchTimeMin(parseFloat(e.target.value, 10))}
          style={{ width: "60px" }}
        />{" "}
      </div>
      <div>
        Fetch Time Max:{" "}
        <input
          type="number"
          min="1"
          step="500"
          value={localFetchTimeMax}
          onChange={(e) => setLocalFetchTimeMax(parseFloat(e.target.value, 10))}
          style={{ width: "60px" }}
        />
      </div>
      <br />
      <App />
      <br />
      <ReactQueryDevtools initialIsOpen />
    </ReactQueryConfigProvider>
  );
}

function App() {
  const [editingIndex, setEditingIndex] = React.useState(null);
  const [views, setViews] = React.useState(["", "fruit", "grape"]);
  // const [views, setViews] = React.useState([""]);

  return (
    <div className="App">
      <div>
        <button onClick={() => queryCache.invalidateQueries(true)}>
          Force Refetch All
        </button>
      </div>
      <br />
      <hr />
      {views.map((view, index) => (
        <div key={index}>
          <Todos
            initialFilter={view}
            setEditingIndex={setEditingIndex}
            onRemove={() => {
              setViews((old) => [...old, ""]);
            }}
          />
          <br />
        </div>
      ))}
      <button
        onClick={() => {
          setViews((old) => [...old, ""]);
        }}
      >
        Add Filter List
      </button>
      <hr />
      {editingIndex !== null ? (
        <>
          <EditTodo
            editingIndex={editingIndex}
            setEditingIndex={setEditingIndex}
          />
          <hr />
        </>
      ) : null}
      <AddTodo />
    </div>
  );
}

function Todos({ initialFilter = "", setEditingIndex }) {
  const [filter, setFilter] = React.useState(initialFilter);

  const { status, data, isFetching, error, failureCount, refetch } = useQuery(
    ["todos", { filter }],
    fetchTodos
  );

  return (
    <div>
      <div>
        <label>
          Filter:{" "}
          <input value={filter} onChange={(e) => setFilter(e.target.value)} />
        </label>
      </div>
      {status === "loading" ? (
        <span>Loading... (Attempt: {failureCount + 1})</span>
      ) : status === "error" ? (
        <span>
          Error: {error.message}
          <br />
          <button onClick={() => refetch()}>Retry</button>
        </span>
      ) : (
        <>
          <ul>
            {data
              ? data.map((todo) => (
                  <li key={todo.id}>
                    {todo.name}{" "}
                    <button onClick={() => setEditingIndex(todo.id)}>
                      Edit
                    </button>
                  </li>
                ))
              : null}
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
  );
}

function EditTodo({ editingIndex, setEditingIndex }) {
  // Don't attempt to query until editingIndex is truthy
  const { status, data, isFetching, error, failureCount, refetch } = useQuery(
    ["todo", { id: editingIndex }],
    fetchTodoById,
    {
      enabled: editingIndex !== null,
    }
  );

  const [todo, setTodo] = React.useState(data || {});

  React.useEffect(() => {
    if (editingIndex !== null && data) {
      setTodo(data);
    } else {
      setTodo({});
    }
  }, [data, editingIndex]);

  const [mutate, mutationState] = useMutation(patchTodo, {
    onSuccess: (data) => {
      // Update `todos` and the individual todo queries when this mutation succeeds
      queryCache.invalidateQueries("todos");
      queryCache.setQueryData(["todo", { id: editingIndex }], data);
    },
  });

  const onSave = () => mutate(todo);

  const disableEditSave =
    status === "loading" || mutationState.status === "loading";

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
      {status === "loading" ? (
        <span>Loading... (Attempt: {failureCount + 1})</span>
      ) : error ? (
        <span>
          Error! <button onClick={() => refetch()}>Retry</button>
        </span>
      ) : (
        <>
          <label>
            Name:{" "}
            <input
              value={todo.name}
              onChange={(e) =>
                e.persist() ||
                setTodo((old) => ({ ...old, name: e.target.value }))
              }
              disabled={disableEditSave}
            />
          </label>
          <label>
            Notes:{" "}
            <input
              value={todo.notes}
              onChange={(e) =>
                e.persist() ||
                setTodo((old) => ({ ...old, notes: e.target.value }))
              }
              disabled={disableEditSave}
            />
          </label>
          <div>
            <button onClick={onSave} disabled={disableEditSave}>
              Save
            </button>
          </div>
          <div>
            {mutationState.status === "loading"
              ? "Saving..."
              : mutationState.status === "error"
              ? mutationState.error.message
              : "Saved!"}
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
  );
}

function AddTodo() {
  const [name, setName] = React.useState("");

  const [mutate, { status, error }] = useMutation(postTodo, {
    onSuccess: () => {
      queryCache.invalidateQueries("todos");
    },
  });

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={status === "loading"}
      />
      <button
        onClick={() => mutate({ name })}
        disabled={status === "loading" || !name}
      >
        Add Todo
      </button>
      <div>
        {status === "loading"
          ? "Saving..."
          : status === "error"
          ? error.message
          : "Saved!"}
      </div>
    </div>
  );
}

function fetchTodos(key, { filter } = {}) {
  console.info("fetchTodos", { filter });
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        return reject(
          new Error(JSON.stringify({ fetchTodos: { filter } }, null, 2))
        );
      }
      resolve(list.filter((d) => d.name.includes(filter)));
    }, queryTimeMin + Math.random() * (queryTimeMax - queryTimeMin));
  });

  promise.cancel = () => console.info("cancelled", filter);

  return promise;
}

function fetchTodoById(key, { id }) {
  console.info("fetchTodoById", { id });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        return reject(
          new Error(JSON.stringify({ fetchTodoById: { id } }, null, 2))
        );
      }
      resolve(list.find((d) => d.id == id));
    }, queryTimeMin + Math.random() * (queryTimeMax - queryTimeMin));
  });
}

function postTodo({ name, notes }) {
  console.info("postTodo", { name, notes });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        return reject(
          new Error(JSON.stringify({ postTodo: { name, notes } }, null, 2))
        );
      }
      const todo = { name, notes, id: id++ };
      list = [...list, todo];
      resolve(todo);
    }, queryTimeMin + Math.random() * (queryTimeMax - queryTimeMin));
  });
}

function patchTodo(todo) {
  console.info("patchTodo", todo);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        return reject(new Error(JSON.stringify({ patchTodo: todo }, null, 2)));
      }
      list = list.map((d) => {
        if (d.id === todo.id) {
          return todo;
        }
        return d;
      });
      resolve(todo);
    }, queryTimeMin + Math.random() * (queryTimeMax - queryTimeMin));
  });
}

const rootElement = document.getElementById("root");
ReactDOM.render(<Root />, rootElement);
