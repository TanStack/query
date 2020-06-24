/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { useQuery, queryCache } from "react-query";
import { ReactQueryDevtools } from "react-query-devtools";

function useGetSomethingExample(id) {
  return useQuery(
    "todos",
    async function queryFn() {
      const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/todos/"
      );
      return data;
    },
    {
      onSuccess: async (data) => {
        console.log(id, data[id]);
      },
    }
  );
}

function ExampleOne() {
  useGetSomethingExample(1);
  return <div>one</div>;
}

function ExampleTwo() {
  useGetSomethingExample(2);
  return <div>two</div>;
}

export default function App() {
  return (
    <div className="App">
      <ExampleOne />
      <ExampleTwo />
      <ReactQueryDevtools initialIsOpen={true} />
      <button
        onClick={() => {
          queryCache.invalidateQueries("todos");
        }}
      >
        refetch "todos" key
      </button>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
