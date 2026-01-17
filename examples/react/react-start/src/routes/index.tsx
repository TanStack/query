import { Link, createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { projectsQuery } from '../utils/queries'
import Spinner from '../components/Spinner'

export const Route = createFileRoute('/')({
  component: RouteComponent,
  // pendingComponent: () => <div>Loading projects...</div>,
  wrapInSuspense: false,
})

function RouteComponent() {
  return (
    <Suspense fallback={<div>Loading projects...</div>}>
      <ProjectsComponent />
    </Suspense>
  )
}

function ProjectsComponent() {
  const { data, isFetching } = useSuspenseQuery(projectsQuery())

  return (
    <div>
      <h1>TanStack Repositories {isFetching ? <Spinner /> : null}</h1>
      <Link to="/">Back</Link>
      {data.map((project) => (
        <p key={project.full_name}>
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.full_name }}
          >
            Load
          </Link>{' '}
          {project.name}
        </p>
      ))}
    </div>
  )
}
