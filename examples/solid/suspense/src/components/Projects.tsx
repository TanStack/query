import { For, Show } from 'solid-js'
import { noop, useQuery, useQueryClient } from '@tanstack/solid-query'
import { projectsQueries } from '../services/projects/queries'
import Button from './Button'
import Spinner from './Spinner'

export default function Projects(props: {
  setActiveProject: (project: string | null) => void
}) {
  const queryClient = useQueryClient()
  const projectsQuery = useQuery(() => ({
    ...projectsQueries.list(),
    throwOnError: true,
  }))

  return (
    <div>
      <h1>
        TanStack Repositories{' '}
        <Show when={projectsQuery.isFetching}>
          <Spinner />
        </Show>
      </h1>
      <For each={projectsQuery.data}>
        {(project) => (
          <p>
            <Button
              onClick={() => {
                // Prefetch the project query
                queryClient
                  .query(projectsQueries.detail(project.full_name))
                  .catch(noop)
                props.setActiveProject(project.full_name)
              }}
            >
              Load
            </Button>{' '}
            {project.name}
          </p>
        )}
      </For>
    </div>
  )
}
