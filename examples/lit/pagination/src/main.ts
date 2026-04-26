import { html, LitElement } from 'lit'
import {
  keepPreviousData,
  QueryClient,
  type QueryKey,
} from '@tanstack/query-core'
import {
  type CreateQueryOptions,
  type MutationResultAccessor,
  QueryClientProvider,
  createMutationController,
  createQueryController,
  type QueryResultAccessor,
} from '@tanstack/lit-query'
import {
  armNextProjectMutationFailureOnServer,
  createProjectOnServer,
  fetchProjectsPage,
  projectsQueryKey,
  resetProjectsApiState,
  toggleProjectFavoriteOnServer,
  type CreateProjectInput,
  type Project,
  type ProjectsPageResponse,
  type ToggleProjectFavoriteInput,
} from './api'

type ProjectsCacheSnapshot = Array<[QueryKey, ProjectsPageResponse | undefined]>
type FavoriteMutationContext = {
  snapshots: ProjectsCacheSnapshot
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5_000,
    },
    mutations: {
      retry: false,
    },
  },
})

class PaginationQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }
}

customElements.define('pagination-query-provider', PaginationQueryProvider)

class PaginationDemo extends LitElement {
  static properties = {
    page: { state: true },
    delayMs: { state: true },
    forceErrorMode: { state: true },
    prefetchStatus: { state: true },
    resetError: { state: true },
    draftName: { state: true },
    draftOwner: { state: true },
    mutationControlStatus: { state: true },
    mutationControlError: { state: true },
  }

  private page = 1
  private delayMs = 250
  private forceErrorMode = false
  private prefetchStatus = 'idle'
  private resetError: string | undefined
  private draftName = 'Platform Rollout'
  private draftOwner = 'Team 6'
  private mutationControlStatus = 'idle'
  private mutationControlError: string | undefined
  private lastAutoPrefetchPage = 0
  private readonly projectsQueryOptions: CreateQueryOptions<
    ProjectsPageResponse,
    Error
  >
  private readonly projectsQuery: QueryResultAccessor<
    ProjectsPageResponse,
    Error
  >
  private readonly createProjectMutation: MutationResultAccessor<
    Project,
    Error,
    CreateProjectInput,
    unknown
  >
  private readonly favoriteMutation: MutationResultAccessor<
    Project,
    Error,
    ToggleProjectFavoriteInput,
    FavoriteMutationContext
  >

  constructor() {
    super()

    this.projectsQueryOptions = {
      queryKey: projectsQueryKey(this.page, this.delayMs, this.forceErrorMode),
      queryFn: () =>
        fetchProjectsPage(this.page, this.delayMs, this.forceErrorMode),
      placeholderData: keepPreviousData,
    }

    this.projectsQuery = createQueryController<ProjectsPageResponse, Error>(
      this,
      this.projectsQueryOptions,
    )

    this.createProjectMutation = createMutationController<
      Project,
      Error,
      CreateProjectInput
    >(
      this,
      {
        mutationKey: ['create-project'],
        mutationFn: async (input) => {
          const response = await createProjectOnServer(input)
          return response.project
        },
        onMutate: () => {
          this.mutationControlStatus = 'idle'
          this.mutationControlError = undefined
        },
        onSuccess: async () => {
          this.page = 1
          this.lastAutoPrefetchPage = 0
          this.prefetchStatus = 'idle'
          this.draftName = ''
          this.draftOwner = 'Team 6'
          this.syncProjectsQueryOptions()
          await queryClient.invalidateQueries({
            queryKey: ['projects'],
            refetchType: 'none',
          })
          await this.projectsQuery.refetch()
        },
      },
      queryClient,
    )

    this.favoriteMutation = createMutationController<
      Project,
      Error,
      ToggleProjectFavoriteInput,
      FavoriteMutationContext
    >(
      this,
      {
        mutationKey: ['toggle-project-favorite'],
        mutationFn: async (input) => {
          const response = await toggleProjectFavoriteOnServer(input)
          return response.project
        },
        onMutate: async (variables) => {
          this.mutationControlStatus = 'idle'
          this.mutationControlError = undefined
          await queryClient.cancelQueries({ queryKey: ['projects'] })

          const snapshots = queryClient.getQueriesData<ProjectsPageResponse>({
            queryKey: ['projects'],
          })

          for (const [key, existing] of snapshots) {
            if (!existing) {
              continue
            }

            queryClient.setQueryData<ProjectsPageResponse>(key, {
              ...existing,
              projects: existing.projects.map((project) =>
                project.id === variables.id
                  ? { ...project, isFavorite: variables.isFavorite }
                  : project,
              ),
            })
          }

          return { snapshots }
        },
        onError: (_error, _variables, context) => {
          for (const [key, snapshot] of context?.snapshots ?? []) {
            queryClient.setQueryData(key, snapshot)
          }
        },
        onSettled: async () => {
          await queryClient.invalidateQueries({ queryKey: ['projects'] })
        },
      },
      queryClient,
    )
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  override updated(): void {
    this.maybePrefetchNextPage()
  }

  private syncProjectsQueryOptions(): void {
    this.projectsQueryOptions.queryKey = projectsQueryKey(
      this.page,
      this.delayMs,
      this.forceErrorMode,
    )
    this.projectsQueryOptions.queryFn = () =>
      fetchProjectsPage(this.page, this.delayMs, this.forceErrorMode)
  }

  private refetchForCurrentState(): void {
    this.syncProjectsQueryOptions()
    void this.projectsQuery.refetch()
  }

  private async maybePrefetchNextPage(): Promise<void> {
    const query = this.projectsQuery()
    const currentData = query.data

    if (!currentData || query.isPlaceholderData || !currentData.hasMore) {
      return
    }

    if (this.lastAutoPrefetchPage === currentData.page) {
      return
    }

    this.lastAutoPrefetchPage = currentData.page
    await this.prefetchPage(currentData.page + 1)
  }

  private onDelayInput(event: Event): void {
    const target = event.target as HTMLInputElement
    const nextValue = Number.parseInt(target.value, 10)

    if (!Number.isInteger(nextValue) || nextValue < 0) {
      return
    }

    this.delayMs = nextValue
    this.refetchForCurrentState()
  }

  private onErrorModeToggle(event: Event): void {
    const target = event.target as HTMLInputElement
    this.forceErrorMode = target.checked
    this.refetchForCurrentState()
  }

  private onDraftNameInput(event: Event): void {
    const target = event.target as HTMLInputElement
    this.draftName = target.value
  }

  private onDraftOwnerInput(event: Event): void {
    const target = event.target as HTMLInputElement
    this.draftOwner = target.value
  }

  private async prefetchPage(targetPage: number): Promise<void> {
    this.prefetchStatus = `pending:${targetPage}`

    try {
      await queryClient.prefetchQuery({
        queryKey: projectsQueryKey(
          targetPage,
          this.delayMs,
          this.forceErrorMode,
        ),
        queryFn: () =>
          fetchProjectsPage(targetPage, this.delayMs, this.forceErrorMode),
      })
      this.prefetchStatus = `ready:${targetPage}`
    } catch (error) {
      this.prefetchStatus = `error:${String(error)}`
    }
  }

  private async prefetchNext(): Promise<void> {
    const query = this.projectsQuery()
    const currentData = query.data

    if (!currentData?.hasMore) {
      this.prefetchStatus = 'skipped:no-next-page'
      return
    }

    await this.prefetchPage(currentData.page + 1)
  }

  private goToPreviousPage(): void {
    if (this.page > 1) {
      this.page -= 1
      this.refetchForCurrentState()
    }
  }

  private goToNextPage(): void {
    const currentData = this.projectsQuery().data
    if (!currentData?.hasMore) {
      return
    }

    this.page += 1
    this.refetchForCurrentState()
  }

  private async resetDemoState(): Promise<void> {
    this.resetError = undefined

    try {
      await resetProjectsApiState()
      this.page = 1
      this.delayMs = 250
      this.forceErrorMode = false
      this.prefetchStatus = 'idle'
      this.resetError = undefined
      this.draftName = 'Platform Rollout'
      this.draftOwner = 'Team 6'
      this.mutationControlStatus = 'idle'
      this.mutationControlError = undefined
      this.lastAutoPrefetchPage = 0
      this.syncProjectsQueryOptions()
      this.createProjectMutation.reset()
      this.favoriteMutation.reset()
      await queryClient.resetQueries({ queryKey: ['projects'] })
      await this.projectsQuery.refetch()
    } catch (error) {
      this.resetError = String(error)
    }
  }

  private submitCreateProject(): void {
    const name = this.draftName.trim()
    const owner = this.draftOwner.trim()

    if (!name || !owner) {
      return
    }

    this.createProjectMutation.mutate({ name, owner })
  }

  private toggleFavorite(project: Project): void {
    this.favoriteMutation.mutate({
      id: project.id,
      isFavorite: !project.isFavorite,
    })
  }

  private async armNextMutationFailure(): Promise<void> {
    this.mutationControlError = undefined

    try {
      await armNextProjectMutationFailureOnServer()
      this.mutationControlStatus = 'armed'
    } catch (error) {
      this.mutationControlStatus = 'error'
      this.mutationControlError = String(error)
    }
  }

  render() {
    const query = this.projectsQuery()
    const projects = query.data?.projects ?? []
    const hasMore = query.data?.hasMore ?? false
    const createProject = this.createProjectMutation()
    const favoriteProject = this.favoriteMutation()

    return html`
      <main>
        <h1>TanStack Lit Query Pagination Demo</h1>
        <p>
          Pagination + mutation demo with optimistic favorite toggles,
          invalidation, and deterministic server failures.
        </p>

        <section>
          <div data-testid="query-status">query: ${query.status}</div>
          <div data-testid="is-fetching">
            isFetching: ${query.isFetching ? 'yes' : 'no'}
          </div>
          <div data-testid="is-placeholder">
            isPlaceholderData: ${query.isPlaceholderData ? 'yes' : 'no'}
          </div>
          <div data-testid="current-page">page: ${this.page}</div>
          <div data-testid="response-page">
            response-page: ${query.data?.page ?? '-'}
          </div>
          <div data-testid="has-more">has-more: ${hasMore ? 'yes' : 'no'}</div>
          <div data-testid="total-projects">
            total-projects: ${query.data?.totalProjects ?? 0}
          </div>
          <div data-testid="total-request-count">
            total-requests: ${query.data?.requestMeta.totalRequestCount ?? 0}
          </div>
          <div data-testid="page-request-count">
            page-requests: ${query.data?.requestMeta.pageRequestCount ?? 0}
          </div>
          <div data-testid="total-mutation-count">
            total-mutations: ${query.data?.requestMeta.totalMutationCount ?? 0}
          </div>
          <div data-testid="prefetch-status">
            prefetch: ${this.prefetchStatus}
          </div>
        </section>

        ${query.isError
          ? html`<p data-testid="query-error">${String(query.error)}</p>`
          : null}
        ${this.resetError
          ? html`<p data-testid="reset-error">${this.resetError}</p>`
          : null}

        <section>
          <label for="delayInput">Delay (ms)</label>
          <input
            id="delayInput"
            data-testid="delay-input"
            type="number"
            min="0"
            .value=${String(this.delayMs)}
            @input=${this.onDelayInput}
          />

          <label for="errorModeToggle">Force query error</label>
          <input
            id="errorModeToggle"
            data-testid="force-error-toggle"
            type="checkbox"
            .checked=${this.forceErrorMode}
            @change=${this.onErrorModeToggle}
          />

          <button
            data-testid="reset-demo-state"
            @click=${() => this.resetDemoState()}
          >
            Reset Demo State
          </button>
          <button
            data-testid="refetch"
            @click=${() => this.projectsQuery.refetch()}
          >
            Refetch
          </button>
          <button
            data-testid="prefetch-next"
            @click=${() => this.prefetchNext()}
          >
            Prefetch Next
          </button>
          <button
            data-testid="arm-mutation-error"
            @click=${() => this.armNextMutationFailure()}
          >
            Fail Next Mutation
          </button>
          <div data-testid="mutation-control-status">
            mutation-control: ${this.mutationControlStatus}
          </div>
          ${this.mutationControlError
            ? html`<div data-testid="mutation-control-error">
                ${this.mutationControlError}
              </div>`
            : null}
        </section>

        <section>
          <div data-testid="create-mutation-status">
            create-mutation: ${createProject.status}
          </div>
          ${createProject.isError
            ? html`<div data-testid="create-mutation-error">
                ${String(createProject.error)}
              </div>`
            : null}

          <label for="projectNameInput">Project name</label>
          <input
            id="projectNameInput"
            data-testid="project-name-input"
            .value=${this.draftName}
            @input=${this.onDraftNameInput}
          />

          <label for="projectOwnerInput">Owner</label>
          <input
            id="projectOwnerInput"
            data-testid="project-owner-input"
            .value=${this.draftOwner}
            @input=${this.onDraftOwnerInput}
          />

          <button
            data-testid="create-project"
            ?disabled=${createProject.isPending}
            @click=${() => this.submitCreateProject()}
          >
            Create Project
          </button>
        </section>

        <section>
          <div data-testid="favorite-mutation-status">
            favorite-mutation: ${favoriteProject.status}
          </div>
          ${favoriteProject.isError
            ? html`<div data-testid="favorite-mutation-error">
                ${String(favoriteProject.error)}
              </div>`
            : null}
        </section>

        <section>
          <button
            data-testid="previous-page"
            ?disabled=${this.page === 1 || query.isPlaceholderData}
            @click=${() => this.goToPreviousPage()}
          >
            Previous
          </button>
          <button
            data-testid="next-page"
            ?disabled=${!hasMore || query.isPlaceholderData}
            @click=${() => this.goToNextPage()}
          >
            Next
          </button>
        </section>

        <ul data-testid="project-list">
          ${projects.map(
            (project) => html`
              <li data-testid="project-item">
                <span data-testid="project-name"
                  >${project.id}: ${project.name} (${project.owner})</span
                >
                <span data-testid="project-favorite-state"
                  >${project.isFavorite ? 'favorite' : 'standard'}</span
                >
                <button
                  data-testid="toggle-favorite"
                  ?disabled=${favoriteProject.isPending}
                  @click=${() => this.toggleFavorite(project)}
                >
                  ${project.isFavorite ? 'Unfavorite' : 'Favorite'}
                </button>
              </li>
            `,
          )}
        </ul>
      </main>
    `
  }
}

customElements.define('pagination-demo', PaginationDemo)

class PaginationDemoRoot extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    return html`
      <pagination-query-provider>
        <pagination-demo></pagination-demo>
      </pagination-query-provider>
    `
  }
}

customElements.define('pagination-demo-root', PaginationDemoRoot)
