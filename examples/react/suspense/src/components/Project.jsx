import React from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'

import Button from './Button'
import Spinner from './Spinner'

import { fetchProject } from '../queries'

export default function Project({ activeProject, setActiveProject }) {
  const [project, { isFetching }] = useSuspenseQuery({
    queryKey: ['project', activeProject],
    queryFn: () => fetchProject(activeProject),
  })

  return (
    <div>
      <Button onClick={() => setActiveProject(null)}>Back</Button>
      <h1>
        {activeProject} {isFetching ? <Spinner /> : null}
      </h1>
      <div>
        <p>forks: {project.forks_count}</p>
        <p>stars: {project.stargazers_count}</p>
        <p>watchers: {project.watchers}</p>
      </div>
      <br />
      <br />
    </div>
  )
}
