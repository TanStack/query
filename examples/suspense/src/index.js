import React from "react";
import ReactDOM from "react-dom";
import { useQuery, useReactQueryConfig } from "react-query";

import "./styles.css";

const projects = [
  "tannerlinsley/react-table",
  "tannerlinsley/react-query",
  "facebook/react",
  "zeit/next.js"
];

function fetchProjects() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(projects);
    }, 2000);
  });
}

async function fetchProject({ id }) {
  const data = await (await fetch(`https://api.github.com/repos/${id}`)).json();

  return new Promise(resolve => {
    resolve(data);
  });
}

function Button({ children, timeoutMs = 3000, onClick }) {
  const [startTransition, isPending] = React.useTransition({
    timeoutMs: timeoutMs
  });

  const handleClick = e => {
    startTransition(() => {
      onClick(e);
    });
  };

  return (
    <>
      <button onClick={handleClick} disabled={isPending}>
        {isPending ? "Loading..." : children}
      </button>
    </>
  );
}

function App() {
  useReactQueryConfig({
    suspense: true
  });

  const [showProjects, setShowProjects] = React.useState(false);
  const [activeProject, setActiveProject] = React.useState(null);

  console.log(activeProject);

  return (
    <>
      <Button onClick={() => setShowProjects(old => !old)}>
        {showProjects ? "Hide Projects" : "Show Projects"}
      </Button>

      {showProjects ? (
        activeProject ? (
          <React.Suspense fallback={<h1>Loading project...</h1>}>
            <Project
              activeProject={activeProject}
              setActiveProject={setActiveProject}
            />
          </React.Suspense>
        ) : (
          <React.Suspense fallback={<h1>Loading projects...</h1>}>
            <Projects setActiveProject={setActiveProject} />
          </React.Suspense>
        )
      ) : null}
    </>
  );
}

function Projects({ setActiveProject }) {
  const { data, isFetching } = useQuery("projects", fetchProjects);

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Trending Projects</h1>
      <div>
        {data.map(project => (
          <p key={project}>
            {project}{" "}
            <Button onClick={() => setActiveProject(project)}>Load</Button>
          </p>
        ))}
      </div>
      <div>{isFetching ? "Background Updating..." : " "}</div>
    </div>
  );
}

function Project({ activeProject, setActiveProject }) {
  const { data, isFetching } = useQuery(
    ["repository", { id: activeProject }],
    fetchProject
  );

  return (
    <div style={{ textAlign: "center" }}>
      <h1>{activeProject}</h1>
      {data ? (
        <>
          <div>
            <p>forks: {data.forks_count}</p>
            <p>stars: {data.stargazers_count}</p>
            <p>watchers: {data.watchers}</p>
          </div>
          <div>{isFetching ? "Background Updating..." : " "}</div>
        </>
      ) : null}
      <br />
      <br />
      <Button onClick={() => setActiveProject(null)}>Back</Button>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<App />);
