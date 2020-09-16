import React, { lazy } from "react";
import ReactDOM from "react-dom";
import {
  useQueryCache,
  QueryCache,
  ReactQueryCacheProvider,
} from "react-query";
import { ReactQueryDevtools } from "react-query-devtools";
import { ErrorBoundary } from "react-error-boundary";

import "./styles.css";

import { fetchProjects } from "./queries";

import Button from "./components/Button";

const Projects = lazy(() => import("./components/Projects"));
const Project = lazy(() => import("./components/Project"));

const queryCache = new QueryCache({
  defaultConfig: {
    queries: {
      retry: 0,
      suspense: true,
    },
  },
});

function App() {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      <Example />
    </ReactQueryCacheProvider>
  );
}

function Example() {
  const cache = useQueryCache();
  const [showProjects, setShowProjects] = React.useState(false);
  const [activeProject, setActiveProject] = React.useState(null);

  return (
    <>
      <Button
        onClick={() => {
          setShowProjects((old) => {
            if (!old) {
              cache.prefetchQuery("projects", fetchProjects);
            }
            return !old;
          });
        }}
      >
        {showProjects ? "Hide Projects" : "Show Projects"}
      </Button>

      <hr />

      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <div>
            There was an error!{" "}
            <Button onClick={() => resetErrorBoundary()}>Try again</Button>
            <pre style={{ whiteSpace: "normal" }}>{error.message}</pre>
          </div>
        )}
        onReset={() => cache.resetErrorBoundaries()}
      >
        <React.Suspense fallback={<h1>Loading projects...</h1>}>
          {showProjects ? (
            activeProject ? (
              <Project
                activeProject={activeProject}
                setActiveProject={setActiveProject}
              />
            ) : (
              <Projects setActiveProject={setActiveProject} />
            )
          ) : null}
        </React.Suspense>
      </ErrorBoundary>
      <ReactQueryDevtools initialIsOpen />
    </>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<App />);
