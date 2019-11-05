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

function Spinner() {
  return (
    <span
      className="fa fa-circle-o-notch fa-spin"
      style={{
        marginLeft: 4,
        fontSize: "small"
      }}
    />
  );
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
        {children} {isPending ? <Spinner /> : null}
      </button>
    </>
  );
}

function App() {
  useReactQueryConfig({
    suspense: true
  });

  const [startTransition] = React.useTransition({
    timeoutMs: 5000
  });
  const [showProjects, setShowProjects] = React.useState(false);
  const [activeProject, setActiveProject] = React.useState(null);

  return (
    <>
      <Button
        onClick={() =>
          startTransition(() => {
            setShowProjects(old => !old);
          })
        }
      >
        {showProjects ? "Hide Projects" : "Show Projects"}
      </Button>

      <hr />

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
    <div>
      <h1>Trending Projects {isFetching ? <Spinner /> : null}</h1>
      {data.map(project => (
        <p key={project}>
          <Button onClick={() => setActiveProject(project)}>Load</Button>{" "}
          {project}
        </p>
      ))}
    </div>
  );
}

function Project({ activeProject, setActiveProject }) {
  const { data, isFetching } = useQuery(
    ["repository", { id: activeProject }],
    fetchProject
  );

  return (
    <div>
      <Button onClick={() => setActiveProject(null)}>Back</Button>
      <h1>
        {activeProject} {isFetching ? <Spinner /> : null}
      </h1>
      {data ? (
        <div>
          <p>forks: {data.forks_count}</p>
          <p>stars: {data.stargazers_count}</p>
          <p>watchers: {data.watchers}</p>
        </div>
      ) : null}
      <br />
      <br />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(<App />);
