import {
  isFetching,
  noop,
  query,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import React from 'react'
import { projectsQueries } from '../services/projects/queries'
import Button from './Button'
import Spinner from './Spinner'

export default function Projects({
  setActiveProject,
}: {
  setActiveProject: React.Dispatch<React.SetStateAction<string | null>>
}) {
  const queryClient = useQueryClient()
  const queryResult = useQuery(projectsQueries.list())
  const { data } = queryResult
  const fetching = isFetching(queryResult)

  return (
    <div>
      <h1>TanStack Repositories {fetching ? <Spinner /> : null}</h1>
      {data.map((project) => (
        <p key={project.full_name}>
          <Button
            onClick={() => {
              // Prefetch the project query
              query(
                queryClient,
                projectsQueries.detail(project.full_name),
              ).catch(noop)
              setActiveProject(project.full_name)
            }}
          >
            Load
          </Button>{' '}
          {project.name}
        </p>
      ))}
    </div>
  )
}
