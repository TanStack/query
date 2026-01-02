import { Link, createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { projectQuery } from '../utils/queries'
import Spinner from '../components/Spinner'

export const Route = createFileRoute('/projects/$projectId')({
  component: RouteComponent,
  pendingComponent: () => <div>Loading project...</div>,
})

function RouteComponent() {
  const projectId = Route.useParams({ select: (params) => params.projectId })
  const { data, isFetching } = useSuspenseQuery(projectQuery(projectId))

  return (
    <div>
      <h1>TanStack Repositories</h1>
      <Link to="/">Back</Link>
      <h1>
        {projectId} {isFetching ? <Spinner /> : null}
      </h1>
      <div>
        <p>forks: {data.forks_count}</p>
        <p>stars: {data.stargazers_count}</p>
        <p>watchers: {data.watchers_count}</p>
      </div>
      <br />
      <br />
    </div>
  )
}
