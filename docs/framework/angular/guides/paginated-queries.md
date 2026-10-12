---
id: paginated-queries
title: Paginated / Lagged Queries
ref: docs/framework/react/guides/paginated-queries.md
replace:
  {
    'useQuery': 'injectQuery',
    'useInfiniteQuery': 'injectInfiniteQuery',
    'hook': 'function',
  }
---

[//]: # 'Example'

```ts
const projectsQuery = injectQuery(() => ({
  queryKey: ['projects', page()],
  queryFn: fetchProjects,
}))
```

[//]: # 'Example'
[//]: # 'Example2'

```angular-ts
@Component({
  selector: 'pagination-example',
  template: `
    <div>
      <p>
        In this example, each page of data remains visible as the next page is
        fetched. The buttons and capability to proceed to the next page are also
        suppressed until the next page cursor is known. Each page is cached as a
        normal query too, so when going to previous pages, you'll see them
        instantaneously while they are also re-fetched invisibly in the
        background.
      </p>
      @if (projectsQuery.status() === 'pending') {
        <div>Loading...</div>
      } @else if (projectsQuery.status() === 'error') {
        <div>Error: {{ projectsQuery.error().message }}</div>
      } @else {
        <!-- 'data' will either resolve to the latest page's data -->
        <!-- or if fetching a new page, the last successful page's data -->
        <div>
          @for (project of projectsQuery.data().projects; track project.id) {
            <p>{{ project.name }}</p>
          }
        </div>
      }

      <div>Current Page: {{ page() + 1 }}</div>
      <button (click)="previousPage()" [disabled]="page() === 0">
        Previous Page
      </button>
      <button
        (click)="nextPage()"
        [disabled]="
          projectsQuery.isPlaceholderData() || !projectsQuery.data()?.hasMore
        "
      >
        Next Page
      </button>
      <!-- Since the last page's data potentially sticks around between page requests, -->
      <!-- we can use 'isFetching' to show a background loading -->
      <!-- indicator since our status === 'pending' state won't be triggered -->
      @if (projectsQuery.isFetching()) {
        <span> Loading...</span>
      }
    </div>
  `,
})
export class PaginationExampleComponent {
  page = signal(0)
  readonly #queryClient = inject(QueryClient)

  readonly projectsQuery = injectQuery(() => ({
    queryKey: ['projects', this.page()],
    queryFn: () => lastValueFrom(fetchProjects(this.page())),
    placeholderData: keepPreviousData,
    staleTime: 5000,
  }))

  constructor() {
    effect(() => {
      // Prefetch the next page!
      if (
        !this.projectsQuery.isPlaceholderData() &&
        this.projectsQuery.data()?.hasMore
      ) {
        void this.#queryClient
          .query({
            queryKey: ['projects', this.page() + 1],
            queryFn: () => lastValueFrom(fetchProjects(this.page() + 1)),
          })
          .catch(noop)
      }
    })
  }

  previousPage() {
    this.page.update((old) => Math.max(old - 1, 0))
  }

  nextPage() {
    this.page.update((old) =>
      this.projectsQuery.data()?.hasMore ? old + 1 : old,
    )
  }
}
```

[//]: # 'Example2'
