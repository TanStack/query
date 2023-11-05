import React from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'

import Button from './Button'
import Spinner from './Spinner'

import { fetchProject } from '../queries'

export default function Project({ activeProject, setActiveProject }) {
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
