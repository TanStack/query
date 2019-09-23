import React from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";

import {
  ReactQueryProvider,
  useQuery,
  useMutation,
  useIsFetching,
  useRefetchAll,
  _useQueryContext
} from "@tannerlinsley/react-query-temp";

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

const QueryKey = styled.div`
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

const fetchTodos = ({ filter }) => {
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

const fetchTodoByID = ({ id }) => {
  console.log("fetchTodoByID", { id });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        return reject(
          new Error(JSON.stringify({ fetchTodoByID: { id } }, null, 2))
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
  const [cacheTime, setCacheTime] = React.useState(5000);
  const [inactiveCacheTime, setInactiveCacheTime] = React.useState(5000);
  const [localErrorRate, setErrorRate] = React.useState(errorRate);
  const [localQueryTimeMin, setLocalQueryTimeMin] = React.useState(
    queryTimeMin
  );
  const [localQueryTimeMax, setLocalQueryTimeMax] = React.useState(
    queryTimeMax
  );

  React.useEffect(() => {
    errorRate = localErrorRate;
    queryTimeMin = localQueryTimeMin;
    queryTimeMax = localQueryTimeMax;
  }, [localErrorRate, localQueryTimeMax, localQueryTimeMin]);

  return (
    <ReactQueryProvider
      config={{
        cacheTime,
        inactiveCacheTime
      }}
    >
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
        Query Time Min:{" "}
        <input
          type="number"
          min="1"
          step="500"
          value={localQueryTimeMin}
          onChange={e => setLocalQueryTimeMin(parseFloat(e.target.value, 10))}
          style={{ width: "60px" }}
        />{" "}
        Query Time Max:{" "}
        <input
          type="number"
          min="1"
          step="500"
          value={localQueryTimeMax}
          onChange={e => setLocalQueryTimeMax(parseFloat(e.target.value, 10))}
          style={{ width: "60px" }}
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
      <div>
        Inactive Cache Time:{" "}
        <input
          type="number"
          min="0"
          step="1000"
          value={inactiveCacheTime}
          onChange={e => setInactiveCacheTime(parseFloat(e.target.value, 10))}
          style={{ width: "100px" }}
        />
      </div>
      <br />
      <App />
    </ReactQueryProvider>
  );
}

function App() {
  const [editingID, setEditingID] = React.useState(null);
  const [views] = React.useState(["", "fruit", "grape"]);
  const [state, _, metaRef] = _useQueryContext();

  return (
    <div className="App">
      <div>
        <QueryKey style={{ background: "green" }} /> Cached{" "}
        <QueryKey style={{ background: "orange" }} /> Fetching{" "}
        <QueryKey style={{ background: "red" }} /> Stale
        <QueryKey style={{ background: "gray" }} /> Inactive
      </div>
      <QueryStateList>
        {Object.keys(state).map(key => {
          const { isFetching, isStale, isInactive } = state[key];
          return (
            <QueryState
              key={key}
              isFetching={isFetching}
              isStale={isStale}
              isInactive={isInactive}
            >
              {key}
            </QueryState>
          );
        })}
      </QueryStateList>
      <br />
      <RefreshingBanner />
      <RefetchAll />
      <br />
      <hr />
      {views.map((view, index) => (
        <div key={index}>
          <Todos initialFilter={view} setEditingID={setEditingID} />
          <br />
        </div>
      ))}
      <hr />
      <EditTodo editingID={editingID} setEditingID={setEditingID} />
      <hr />
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

function RefetchAll() {
  const refetchAll = useRefetchAll();
  return (
    <div>
      <button onClick={() => refetchAll({ disableThrow: true })}>
        Refetch All
      </button>
    </div>
  );
}

function Todos({ initialFilter = "", setEditingID }) {
  const [filter, setFilter] = React.useState(initialFilter);
  const {
    data,
    isLoading,
    isFetching,
    error,
    failureCount,
    refetch
  } = useQuery(fetchTodos, {
    variables: {
      filter
    }
  });

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
                    <button onClick={() => setEditingID(todo.id)}>Edit</button>
                  </li>
                ))
              : null}
          </ul>
          <div>
            {isFetching ? (
              <span>
                Background Refreshing... (Attempt: {failureCount + 1})
              </span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function EditTodo({ editingID, setEditingID }) {
  // Query for the individual todo
  const queryState = useQuery(fetchTodoByID, {
    manual: editingID === null,
    variables: {
      id: editingID
    }
  });

  const [todo, setTodo] = React.useState(queryState.data);

  React.useEffect(() => {
    if (typeof editingID === "number" && queryState.data) {
      setTodo(queryState.data);
    } else {
      setTodo();
    }
  }, [editingID, queryState.data]);

  // Create a mutation for u
  const [mutate, mutationState] = useMutation(patchTodo, {
    refetchQueries: [fetchTodos],
    updateQueries: [
      {
        query: fetchTodoByID,
        variables: {
          id: editingID
        }
      }
    ]
  });

  const canEditOrSave = queryState.isLoading || mutationState.isLoading;

  return (
    <div>
      <div>
        <button onClick={() => setEditingID(null)}>Back</button> Editing Todo #
        {editingID}
      </div>
      {queryState.isLoading ? (
        <span>Loading... (Attempt: {queryState.failureCount + 1})</span>
      ) : queryState.error ? (
        <span>
          Error!{" "}
          <button onClick={() => queryState.refetch({ disableThrow: true })}>
            Retry
          </button>
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
            <button
              onClick={() => mutate(todo, { disableThrow: true })}
              disabled={canEditOrSave}
            >
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
            {queryState.isFetching ? (
              <span>
                Background Refreshing... (Attempt: {queryState.failureCount + 1}
                )
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <span>Not editing a todo.</span>
      )}
    </div>
  );
}

function AddTodo() {
  const [name, setName] = React.useState("");

  const [mutate, { data, isLoading, error }] = useMutation(postTodo, {
    refetchQueries: [fetchTodos]
  });

  return (
    <div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        disabled={isLoading}
      />
      <button
        onClick={() => mutate({ name }, { disableThrow: true })}
        disabled={isLoading || !name}
      >
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
