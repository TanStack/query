import React from "react";
import { useQuery, useQueryClient } from "react-query";

import Button from "./Button";
import Spinner from "./Spinner";

import { fetchProjects, fetchProject } from "../queries";

export default function Projects({ setActiveProject }) {
  const client = useQueryClient();
  const { data, isFetching } = useQuery("projects", fetchProjects);

  return (
    <div>
      <h1>Projects {isFetching ? <Spinner /> : null}</h1>
      {data.map((project) => (
        <p key={project.name}>
          <Button
            onClick={() => {
              // Prefetch the project query
              client.prefetchQuery(
                ["project", { id: project.name }],
                fetchProject
              );
              setActiveProject(project.name);
            }}
          >
            Load
          </Button>{" "}
          {project.name}
        </p>
      ))}
    </div>
  );
}
