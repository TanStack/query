import React from "react";
import ReactDOM from "react-dom";

import {
  ReactQueryProvider,
  useQuery,
  useMutation,
  useIsFetching,
  useRefetchAll
} from "@tannerlinsley/react-query-temp";

import "./styles.css";

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

const fetchTodos = ({ filter }) => {
  console.log("fetchTodos", { filter });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        return reject(new Error("Oh no!"));
      }
      resolve(list.filter(d => d.name.includes(filter)));
    }, 1000);
  });
};

const fetchTodoByID = ({ id }) => {
  console.log("fetchTodoByID", { id });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        return reject(new Error("Oh no!"));
      }
      resolve(list.find(d => d.id === id));
    }, 1000);
  });
};

const postTodo = ({ name, notes }) => {
  console.log("postTodo", { name, notes });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        return reject(new Error("Oh no!"));
      }
      const todo = { name, notes, id: id++ };
      list = [...list, todo];
      resolve(todo);
    }, 1000);
  });
};

const patchTodo = todo => {
  console.log("patchTodo", todo);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        return reject(new Error("Oh no!"));
      }
      list = list.map(d => {
        if (d.id === todo.id) {
          return todo;
        }
        return d;
      });
      resolve(todo);
    }, 1000);
  });
};

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
    },
    cacheTime: 5000
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

function EditTodo({ editingID, setEditingID }) {
  // Query for the individual todo
  const queryState = useQuery(fetchTodoByID, {
    manual: typeof editingID !== "number",
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

function RefreshingBanner() {
  const isFetching = useIsFetching();
  return (
    <div>
      isFetching: {isFetching.toString()}
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

function App() {
  const [editingID, setEditingID] = React.useState(null);
  const [localErrorRate, setErrorRate] = React.useState(errorRate);
  const [views] = React.useState(["", "fruit", "apple"]);

  React.useEffect(() => {
    errorRate = localErrorRate;
  }, [localErrorRate]);

  return (
    <ReactQueryProvider>
      <div className="App">
        <h1>Hello CodeSandbox</h1>
        <h2>Start editing to see some magic happen!</h2>
        <RefreshingBanner />
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
        <RefetchAll />
        <br />
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
    </ReactQueryProvider>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
