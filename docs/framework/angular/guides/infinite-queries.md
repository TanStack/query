---
id: infinite-queries
title: Infinite Queries
ref: docs/framework/react/guides/infinite-queries.md
replace:
  { 'useQuery': 'injectQuery', 'useInfiniteQuery': 'injectInfiniteQuery' }
---

[//]: # 'Example'

```angular-ts
import { Component, computed, inject } from '@angular/core'
import { injectInfiniteQuery } from '@tanstack/angular-query'
import { lastValueFrom } from 'rxjs'
import { ProjectsService } from './projects-service'

@Component({
  selector: 'example',
  templateUrl: './example.component.html',
})
export class Example {
  readonly projectsService = inject(ProjectsService)

  readonly projectsQuery = injectInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: async ({ pageParam }) => {
      return lastValueFrom(this.projectsService.getProjects(pageParam))
    },
    initialPageParam: 0,
    getPreviousPageParam: (firstPage) => firstPage.previousId ?? undefined,
    getNextPageParam: (lastPage) => lastPage.nextId ?? undefined,
    maxPages: 3,
  }))

  nextButtonDisabled = computed(
    () => !this.#hasNextPage() || this.#isFetchingNextPage(),
  )
  nextButtonText = computed(() =>
    this.#isFetchingNextPage()
      ? 'Loading more...'
      : this.#hasNextPage()
        ? 'Load newer'
        : 'Nothing more to load',
  )

  #hasNextPage = this.projectsQuery.hasNextPage
  #isFetchingNextPage = this.projectsQuery.isFetchingNextPage
}
```

```angular-html
<div>
  @if (projectsQuery.isPending()) {
    <p>Loading...</p>
  } @else if (projectsQuery.isError()) {
    <span>Error: {{ projectsQuery?.error().message }}</span>
  } @else {
    @for (page of projectsQuery?.data().pages; track $index) {
      @for (project of page.data; track project.id) {
        <p>{{ project.name }} {{ project.id }}</p>
      }
    }
    <div>
      <button
        (click)="projectsQuery.fetchNextPage()"
        [disabled]="nextButtonDisabled()"
      >
        {{ nextButtonText() }}
      </button>
    </div>
  }
</div>
```

[//]: # 'Example'
[//]: # 'Example1'

```angular-ts
@Component({
  template: ` <list-component (endReached)="fetchNextPage()" /> `,
})
export class Example {
  readonly projectsQuery = injectInfiniteQuery(() => ({
    queryKey: ['projects'],
    queryFn: async ({ pageParam }) => {
      return lastValueFrom(this.projectsService.getProjects(pageParam))
    },
  }))

  fetchNextPage() {
    // Do nothing if already fetching
    if (this.projectsQuery.isFetching()) return
    this.projectsQuery.fetchNextPage()
  }
}
```

[//]: # 'Example1'
[//]: # 'Example3'

```ts
projectsQuery = injectInfiniteQuery(() => ({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, pages) => firstPage.prevCursor,
}))
```

[//]: # 'Example3'
[//]: # 'Example4'

```ts
projectsQuery = injectInfiniteQuery(() => ({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  select: (data) => ({
    pages: [...data.pages].reverse(),
    pageParams: [...data.pageParams].reverse(),
  }),
}))
```

[//]: # 'Example4'
[//]: # 'Example8'

```ts
injectInfiniteQuery(() => ({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, pages) => firstPage.prevCursor,
  maxPages: 3,
}))
```

[//]: # 'Example8'
[//]: # 'Example9'

```ts
injectInfiniteQuery(() => ({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage, allPages, lastPageParam) => {
    if (lastPage.length === 0) {
      return undefined
    }
    return lastPageParam + 1
  },
  getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
    if (firstPageParam <= 1) {
      return undefined
    }
    return firstPageParam - 1
  },
}))
```

[//]: # 'Example9'
