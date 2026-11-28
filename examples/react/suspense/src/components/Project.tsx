import { isFetching, useQuery } from '@tanstack/react-query'
import React from 'react'
import { projectsQueries } from '../services/projects/queries'
import Button from './Button'
import Spinner from './Spinner'

export default function Project({
  activeProject,
  setActiveProject,
}: {
  activeProject: string
  setActiveProject: React.Dispatch<React.SetStateAction<string | null>>
}) {
  const queryResult = useQuery(projectsQueries.detail(activeProject))
  const { data } = queryResult
  const fetching = isFetching(queryResult)

  return (
    <div>
      <Button onClick={() => setActiveProject(null)}>Back</Button>
      <h1>
        {activeProject} {fetching ? <Spinner /> : null}
      </h1>
      <div>
        <p>forks: {data.forks_count}</p>
        <p>stars: {data.stargazers_count}</p>
        <p>watchers: {data.subscribers_count}</p>
      </div>
      <br />
      <br />
    </div>
  )
}
