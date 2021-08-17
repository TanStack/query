import React, { useEffect, useRef, useState } from "react";

import axios from "axios";

//

import {
  useQuery,
  useQueryClient,
  useMutation,
  QueryClient,
  QueryClientProvider
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  );
}
function useIncrementingTime(
  enabled = false,
  baseTime = 5000,
  baseIncreaseRateTime = 30000
) {
  const [incrementingTime, setIncrementingTime] = useState(baseTime);
  const [increaseRateTime, setIncreaseRateTime] = useState(
    baseIncreaseRateTime
  );
  const [incrementIntervalId, setIncrementIntervalId] = useState(undefined);
  const [increaseIntervalId, setIncreaseIntervalId] = useState(undefined);

  useEffect(() => {
    const clearIntervals = () => {
      //if (incrementIntervalId && increaseIntervalId) {
      clearInterval(incrementIntervalId);
      clearInterval(increaseIntervalId);
      //}
      setIncrementingTime(baseTime);
      setIncreaseRateTime(baseIncreaseRateTime);
      setIncreaseIntervalId(undefined);
      setIncrementIntervalId(undefined);
    };

    if (!enabled) {
      clearIntervals();
      return;
    }

    if (!incrementIntervalId) {
      setIncrementIntervalId(
        setInterval(
          () => setIncrementingTime((prev) => prev + baseTime),
          increaseRateTime
        )
      );
      setIncreaseIntervalId(
        setInterval(
          () => setIncreaseRateTime((prev) => prev + baseIncreaseRateTime),
          increaseRateTime + baseIncreaseRateTime
        )
      );
    }

    console.log({
      baseTime,
      baseIncreaseRateTime,
      increaseRateTime,
      increaseIntervalId,
      incrementIntervalId,
      enabled
    });
    return () => {
      console.log("I would clean up here.");
    };
  }, [
    enabled,
    incrementIntervalId,
    baseTime,
    baseIncreaseRateTime,
    increaseRateTime,
    increaseIntervalId
  ]);

  return incrementingTime;
}
// function useIncrementingTime_(
//   enabled = false,
//   baseTime = 500,
//   baseIncreaseRateTime = 3000
// ) {
//   const [incrementingTime, setIncrementingTime] = useState(baseTime);
//   const [increaseRateTime, setIncreaseRateTime] = useState(
//     baseIncreaseRateTime
//   );
//   const [incrementIntervalId, setIncrementIntervalId] = useState(undefined);
//   const [increaseIntervalId, setIncreaseIntervalId] = useState(undefined);

//   useEffect(() => {
//     const clearIntervals = () => {
//       console.log("clearing intervals");
//       // if (incrementIntervalId && increaseIntervalId) {
//       clearInterval(incrementIntervalId);
//       clearInterval(increaseIntervalId);
//       // }
//       setIncrementingTime(baseTime);
//       setIncreaseRateTime(baseIncreaseRateTime);
//       setIncreaseIntervalId(undefined);
//       setIncrementIntervalId(undefined);
//     };

//     if (!enabled) {
//       clearIntervals();
//     }

//     if (!incrementIntervalId) {
//       // console.log("setting INCREMENT interval ---");
//       setIncrementIntervalId(
//         setInterval(() => {
//           // clearInterval(incrementIntervalId);
//           // console.log("inside callback");
//           setIncrementingTime((prev) => {
//             // console.log({ prev, baseTime });
//             return prev + baseTime;
//           });
//         }, increaseRateTime)
//       );
//       console.log("setting INCREASE interval +++", {
//         increaseRateTime,
//         baseIncreaseRateTime
//       });
//       setIncreaseIntervalId(
//         setInterval(() => {
//           clearInterval(increaseIntervalId);
//           clearInterval(incrementIntervalId);
//           console.log(
//             "inside callback",
//             increaseRateTime,
//             baseIncreaseRateTime
//           );
//           setIncrementingTime((prev) => prev + baseIncreaseRateTime);
//           setIncreaseRateTime((prev) => prev + baseIncreaseRateTime);
//         }, increaseRateTime + baseIncreaseRateTime)
//       );
//     }
//     console.log({
//       incrementingTime,
//       baseTime,
//       baseIncreaseRateTime,
//       increaseRateTime,
//       increaseIntervalId,
//       incrementIntervalId,
//       enabled
//     });
//     //return () => clearIntervals();
//   }, [
//     enabled,
//     incrementIntervalId,
//     baseTime,
//     baseIncreaseRateTime,
//     increaseRateTime,
//     incrementingTime,
//     increaseIntervalId
//   ]);

//   return incrementingTime;
// }

function Example() {
  const queryClient = useQueryClient();
  // const [intervalMs, setIntervalMs] = React.useState(1000)
  const intervalMs = useIncrementingTime(1);
  const [value, setValue] = React.useState("");

  console.log(`#### ${intervalMs} ####`);

  const { status, data, error, isFetching } = useQuery(
    "todos",
    async () => {
      const res = await axios.get("/api/data");
      return res.data;
    },
    {
      // Refetch the data every second
      refetchInterval: intervalMs
    }
  );

  const addMutation = useMutation((value) => fetch(`/api/data?add=${value}`), {
    onSuccess: () => queryClient.invalidateQueries("todos")
  });

  const clearMutation = useMutation(() => fetch(`/api/data?clear=1`), {
    onSuccess: () => queryClient.invalidateQueries("todos")
  });

  if (status === "loading") return <h1>Loading...</h1>;
  if (status === "error") return <span>Error: {error.message}</span>;

  return (
    <div>
      <h1>Auto Refetch with stale-time set to 1s)</h1>
      <p>
        This example is best experienced on your own machine, where you can open
        multiple tabs to the same localhost server and see your changes
        propagate between the two.
      </p>
      <label>
        Query Interval speed (ms):{" "}
        <input
          value={intervalMs}
          onChange={(ev) => setIntervalMs(Number(ev.target.value))}
          type="number"
          step="100"
        />{" "}
        <span
          style={{
            display: "inline-block",
            marginLeft: ".5rem",
            width: 10,
            height: 10,
            background: isFetching ? "green" : "transparent",
            transition: !isFetching ? "all .3s ease" : "none",
            borderRadius: "100%",
            transform: "scale(2)"
          }}
        />
      </label>
      <h2>Todo List</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          addMutation.mutate(value, {
            onSuccess: () => {
              setValue("");
            }
          });
        }}
      >
        <input
          placeholder="enter something"
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
        />
      </form>
      <ul>
        {data.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div>
        <button
          onClick={() => {
            clearMutation.mutate();
          }}
        >
          Clear All
        </button>
      </div>
      <ReactQueryDevtools initialIsOpen />
    </div>
  );
}
