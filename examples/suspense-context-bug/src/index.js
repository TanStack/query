import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  Suspense
} from "react";
import ReactDOM from "react-dom";
import { ReactQueryConfigProvider, useQuery } from "react-query";

const TestContext = createContext();

const Provider = props => {
  const [test, setTest] = useState(false);

  useEffect(() => {
    setTest(true);
  }, []);

  return <TestContext.Provider value={test} {...props} />;
};

const useTestContext = () => {
  return useContext(TestContext);
};

const getData = () => ({ test: "plz render" });

const Inner = () => {
  const test = useTestContext();
  const { data } = useQuery(test && ["test"], getData);

  return data ? <div>{data.test}</div> : null;
};

const queryConfig = {
  suspense: true
};

const Test = () => (
  <ReactQueryConfigProvider config={queryConfig}>
    <Suspense fallback="Loading...">
      <Provider>
        <Inner />
      </Provider>
    </Suspense>
  </ReactQueryConfigProvider>
);

const rootElement = document.getElementById("root");
ReactDOM.render(<Test />, rootElement);
