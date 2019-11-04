import React from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";

import {
  useReactQueryConfig,
  useQuery,
  useMutation,
  refetchAllQueries,
  useIsFetching,
  _useQueries
} from "react-query";

import "./styles.css";

const QueryStateList = styled.div`
  display: flex;
  padding: 0.15rem;
  flex-wrap: wrap;
`;

const QueryState = styled.div`
  margin: 0.3rem;
  color: white;
  padding: 0.3rem;
  font-size: 12px;
  border-radius: 0.3rem;
  font-weight: bold;
  text-shadow: 0 0 10px black;

  background: ${props =>
    props.isFetching
      ? "orange"
      : props.isInactive
      ? "grey"
      : props.isStale
      ? "red"
      : "green"};
`;

const QueryKeys = styled.div`
  font-size: 0.7rem;
`;

const QueryKey = styled.span`
  width: 20px;
  height: 20px;
  display: inline-block;
`;

let id = 0;
let list = [
  "apple",
  "banana",
  "pineapple",
  "grapefruit",
  "dragonfruit",
  "grapes"
].map(d => ({ id: id++, name: d, notes: "These are some notes" }));

let errorRate = 0.05;
let queryTimeMin = 1000;
let queryTimeMax = 2000;

const fetchTodos = ({ filter } = {}) => {
  console.log("fetchTodos", { filter });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        return reject(
          new Error(JSON.stringify({ fetchTodos: { filter } }, null, 2))
        );
      }
      resolve(list.filter(d => d.name.includes(filter)));
    }, queryTimeMin + Math.random() * (queryTimeMax - queryTimeMin));
  });
};

const fetchTodoById = ({ id }) => {
  console.log("fetchTodoById", { id });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        return reject(
          new Error(JSON.stringify({ fetchTodoById: { id } }, null, 2))
        );
      }
      resolve(list.find(d => d.id === id));
    }, queryTimeMin + Math.random() * (queryTimeMax - queryTimeMin));
  });
};

const postTodo = ({ name, notes }) => {
  console.log("postTodo", { name, notes });
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
};

const patchTodo = todo => {
  console.log("patchTodo", todo);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        return reject(new Error(JSON.stringify({ patchTodo: todo }, null, 2)));
      }
      list = list.map(d => {
        if (d.id === todo.id) {
          return todo;
        }
        return d;
      });
      resolve(todo);
    }, queryTimeMin + Math.random() * (queryTimeMax - queryTimeMin));
  });
};

function Root() {
  const [staleTime, setStaleTime] = React.useState(500);
  const [cacheTime, setCacheTime] = React.useState(2000);
  const [localErrorRate, setErrorRate] = React.useState(errorRate);
  const [localFetchTimeMin, setLocalFetchTimeMin] = React.useState(
    queryTimeMin
  );
  const [localFetchTimeMax, setLocalFetchTimeMax] = React.useState(
    queryTimeMax
  );

  useReactQueryConfig({
    staleTime,
    cacheTime
    // refetchAllOnWindowFocus: false
  });

  React.useEffect(() => {
    errorRate = localErrorRate;
    queryTimeMin = localFetchTimeMin;
    queryTimeMax = localFetchTimeMax;
  }, [localErrorRate, localFetchTimeMax, localFetchTimeMin]);

  return (
    <>
      <p>
        The "staleTime" and "cacheTime" durations have been altered in this
        example to show how query stale-ness and query caching work on a
        granular level
      </p>
      <div>
        Error Rate:{" "}
        <input
          type="number"
          min="0"
          max="1"
          step=".05"
          value={localErrorRate}
          onChange={e => setErrorRate(parseFloat(e.target.value, 10))}
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
          onChange={e => setLocalFetchTimeMin(parseFloat(e.target.value, 10))}
          style={{ width: "60px" }}
        />{" "}
        Fetch Time Max:{" "}
        <input
          type="number"
          min="1"
          step="500"
          value={localFetchTimeMax}
          onChange={e => setLocalFetchTimeMax(parseFloat(e.target.value, 10))}
          style={{ width: "60px" }}
        />
      </div>
      <div>
        Stale Time:{" "}
        <input
          type="number"
          min="0"
          step="1000"
          value={staleTime}
          onChange={e => setStaleTime(parseFloat(e.target.value, 10))}
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
          onChange={e => setCacheTime(parseFloat(e.target.value, 10))}
          style={{ width: "100px" }}
        />
      </div>
      <br />
      <App />
    </>
  );
}

function App() {
  const [editingIndex, setEditingIndex] = React.useState(null);
  const [views, setViews] = React.useState(["", "fruit", "grape"]);
  // const [views, setViews] = React.useState([""]);

  const queries = _useQueries();

  return (
    <div className="App">
      Queries - <small>Click a query to log to console)</small>
      <QueryStateList>
        {queries.map(query => {
          const {
            queryHash,
            state: { isFetching, isStale, isInactive }
          } = query;

          return (
            <QueryState
              key={queryHash}
              isFetching={isFetching}
              isStale={isStale}
              isInactive={isInactive}
              onClick={() => {
                console.info(query);
              }}
            >
              {queryHash}
            </QueryState>
          );
        })}
      </QueryStateList>
      <QueryKeys>
        <span>
          <QueryKey style={{ background: "green" }} /> Cached{" "}
        </span>
        <span>
          <QueryKey style={{ background: "orange" }} /> Fetching{" "}
        </span>
        <span>
          <QueryKey style={{ background: "red" }} /> Stale{" "}
        </span>
        <span>
          <QueryKey style={{ background: "gray" }} /> Inactive
        </span>
      </QueryKeys>
      <br />
      <RefreshingBanner />
      <div>
        <button
          onClick={async () => {
            try {
              refetchAllQueries({ force: true });
            } catch {}
          }}
        >
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
              setViews(old => [...old, ""]);
            }}
          />
          <br />
        </div>
      ))}
      <button
        onClick={() => {
          setViews(old => [...old, ""]);
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

function RefreshingBanner() {
  const isFetching = useIsFetching();
  return (
    <div>
      Global <code>isFetching</code>: {isFetching.toString()}
      <br />
      <br />
    </div>
  );
}

function Todos({ initialFilter = "", setEditingIndex }) {
  const [filter, setFilter] = React.useState(initialFilter);

  const {
    data,
    isLoading,
    isFetching,
    error,
    failureCount,
    refetch
  } = useQuery(["todos", { filter }], fetchTodos);

  return (
    <div>
      <div>
        <label>
          Filter:{" "}
          <input value={filter} onChange={e => setFilter(e.target.value)} />
        </label>
      </div>
      {isLoading ? (
        <span>Loading... (Attempt: {failureCount + 1})</span>
      ) : error ? (
        <span>
          Error!{" "}
          <button onClick={() => refetch({ disableThrow: true })}>Retry</button>
        </span>
      ) : (
        <>
          <ul>
            {data
              ? data.map(todo => (
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
  const {
    data,
    isLoading,
    isFetching,
    error,
    failureCount,
    refetch
  } = useQuery(
    editingIndex !== null && ["todo", { id: editingIndex }],
    fetchTodoById
  );

  const [todo, setTodo] = React.useState(data);

  React.useEffect(() => {
    if (editingIndex !== null && data) {
      console.log(data);
      setTodo(data);
    } else {
      setTodo();
    }
  }, [data, editingIndex]);

  const [mutate, mutationState] = useMutation(patchTodo, {
    refetchQueries: ["todos"]
  });

  const onSave = () => {
    try {
      mutate(todo, {
        // Update `todos` and the individual todo queries when this mutation succeeds
        updateQuery: ["todo", { id: editingIndex }]
      });
    } catch {
      // Errors are shown in the UI
    }
  };

  const canEditOrSave = isLoading || mutationState.isLoading;

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
      {isLoading ? (
        <span>Loading... (Attempt: {failureCount + 1})</span>
      ) : error ? (
        <span>
          Error!{" "}
          <button onClick={() => refetch({ disableThrow: true })}>Retry</button>
        </span>
      ) : todo ? (
        <>
          <label>
            Name:{" "}
            <input
              value={todo.name}
              onChange={e =>
                e.persist() ||
                setTodo(old => ({ ...old, name: e.target.value }))
              }
              disabled={canEditOrSave}
            />
          </label>
          <label>
            Notes:{" "}
            <input
              value={todo.notes}
              onChange={e =>
                e.persist() ||
                setTodo(old => ({ ...old, notes: e.target.value }))
              }
              disabled={canEditOrSave}
            />
          </label>
          <div>
            <button onClick={onSave} disabled={canEditOrSave}>
              Save
            </button>
          </div>
          <div>
            {mutationState.isLoading
              ? "Saving..."
              : mutationState.error
              ? String(mutationState.error)
              : mutationState.data
              ? "Saved!"
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
      ) : null}
    </div>
  );
}

function AddTodo() {
  const [name, setName] = React.useState("");

  const [mutate, { isLoading, error, data }] = useMutation(postTodo, {
    refetchQueries: ["todos"]
  });

  return (
    <div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        disabled={isLoading}
      />
      <button onClick={() => mutate({ name })} disabled={isLoading || !name}>
        Add Todo
      </button>
      <div>
        {isLoading
          ? "Saving..."
          : error
          ? String(error)
          : data
          ? "Saved!"
          : null}
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<Root />, rootElement);
