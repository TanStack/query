import React, { lazy } from "react";
import ReactDOM from "react-dom";
import { ReactQueryConfigProvider, queryCache } from "react-query";

import "./styles.css";

import { fetchProjects } from "./queries";

import ErrorBounderay from "./components/ErrorBounderay";
import Button from "./components/Button";

const Projects = lazy(() => import("./components/Projects"));
const Project = lazy(() => import("./components/Project"));

const queryConfig = {
  shared: {
    suspense: true
  }
};

function App() {
  const [showProjects, setShowProjects] = React.useState(false);
  const [activeProject, setActiveProject] = React.useState(null);

  return (
    <ReactQueryConfigProvider config={queryConfig}>
      <Button
        onClick={() => {
          setShowProjects(old => {
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

      <ErrorBounderay>
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
      </ErrorBounderay>
    </ReactQueryConfigProvider>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<App />);
