import {
  isFetching,
  suspenseQueryOptions,
  useQuery,
} from '@tanstack/preact-query'
import { projectsQueries } from '../services/projects/queries'
import Button from './Button'
import Spinner from './Spinner'

export default function Project({
  activeProject,
  setActiveProject,
}: {
  activeProject: string
  setActiveProject: (activeProject: string | null) => void
}) {
  const queryResult = useQuery(
    suspenseQueryOptions(projectsQueries.detail(activeProject)),
  )

  return (
    <div>
      <Button onClick={() => setActiveProject(null)}>Back</Button>
      <h1>
        {activeProject} {isFetching(queryResult) ? <Spinner /> : null}
      </h1>
      <div>
        <p>forks: {queryResult.data.forks_count}</p>
        <p>stars: {queryResult.data.stargazers_count}</p>
        <p>watchers: {queryResult.data.subscribers_count}</p>
      </div>
      <br />
      <br />
    </div>
  )
}
