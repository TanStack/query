import { noop, useQueryClient, useSuspenseQuery } from '@tanstack/preact-query'
import { projectsQueries } from '../services/projects/queries'
import Button from './Button'
import Spinner from './Spinner'

export default function Projects({
  setActiveProject,
}: {
  setActiveProject: (activeProject: string | null) => void
}) {
  const queryClient = useQueryClient()
  const { data, isFetching } = useSuspenseQuery(projectsQueries.list())

  return (
    <div>
      <h1>TanStack Repositories {isFetching ? <Spinner /> : null}</h1>
      {data.map((project) => (
        <p key={project.full_name}>
          <Button
            onClick={() => {
              // Prefetch the project query
              queryClient
                .query(projectsQueries.detail(project.full_name))
                .catch(noop)
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
