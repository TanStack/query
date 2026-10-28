import { Show } from 'solid-js'
import { useQuery } from '@tanstack/solid-query'
import { projectsQueries } from '../services/projects/queries'
import Button from './Button'
import Spinner from './Spinner'

export default function Project(props: {
  activeProject: string
  setActiveProject: (project: string | null) => void
}) {
  const projectQuery = useQuery(() => ({
    ...projectsQueries.detail(props.activeProject),
    throwOnError: true,
  }))

  return (
    <div>
      <Button onClick={() => props.setActiveProject(null)}>Back</Button>
      <h1>
        {props.activeProject}{' '}
        <Show when={projectQuery.isFetching}>
          <Spinner />
        </Show>
      </h1>
      <div>
        <p>forks: {projectQuery.data?.forks_count}</p>
        <p>stars: {projectQuery.data?.stargazers_count}</p>
        <p>watchers: {projectQuery.data?.subscribers_count}</p>
      </div>
      <br />
      <br />
    </div>
  )
}
