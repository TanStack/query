import React, { lazy } from "react";
import ReactDOM from "react-dom";
import { ReactQueryConfigProvider, queryCache } from "react-query";
import { ReactQueryDevtools } from "react-query-devtools";
import { ErrorBoundary } from "react-error-boundary";

import "./styles.css";

import { fetchProjects } from "./queries";

import Button from "./components/Button";

const Projects = lazy(() => import("./components/Projects"));
const Project = lazy(() => import("./components/Project"));

const queryConfig = {
  shared: {
    suspense: true,
  },
  queries: {
    retry: 0,
  },
};

function App() {
  const [showProjects, setShowProjects] = React.useState(false);
  const [activeProject, setActiveProject] = React.useState(null);

  return (
    <ReactQueryConfigProvider config={queryConfig}>
      <Button
        onClick={() => {
          setShowProjects((old) => {
            if (!old) {
              queryCache.prefetchQuery("projects", fetchProjects);
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
        onReset={() => queryCache.resetErrorBoundaries()}
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
    </ReactQueryConfigProvider>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<App />);
