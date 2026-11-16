import React from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
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
  const { data, isFetching } = useSuspenseQuery(
    projectsQueries.detail(activeProject),
  )

  return (
    <div>
      <Button onClick={() => setActiveProject(null)}>Back</Button>
      <h1>
        {activeProject} {isFetching ? <Spinner /> : null}
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
