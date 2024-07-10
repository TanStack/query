import React from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { fetchProject } from '../queries'
import Button from './Button'
import Spinner from './Spinner'

export default function Project({
  activeProject,
  setActiveProject,
}: {
  activeProject: string | null
  setActiveProject: React.Dispatch<React.SetStateAction<string | null>>
}) {
  console.log(activeProject)

  const { data, isFetching } = useSuspenseQuery({
    queryKey: ['project', activeProject],
    queryFn: () => fetchProject(activeProject),
  })

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
  )
}
