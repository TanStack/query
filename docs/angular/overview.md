---
id: overview
title: Overview
---

> VERY IMPORTANT: This library is currently in an experimental stage. This means that breaking changes will happen in minor AND patch releases. Use at your own risk. If you choose to rely on this in production in an experimental stage, please lock your version to a patch-level version to avoid unexpected breakages.

The `@tanstack/angular-query-experimental` package offers a 1st-class API for using TanStack Query via Angular.

## Feedback very welcome
We are in the process of getting to a stable API for Angular Query. If you have any feedback, please contact us at the [TanStack Discord](https://tlinz.com/discord) server or [visit this discussion](https://github.com/TanStack/query/discussions/6293) on Github.

## Versions of Angular supported
The adapter works with signals, which means it only supports Angular 16+

## Example
```typescript
import { AngularQueryDevtoolsComponent } from '@tanstack/angular-query-devtools-experimental'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { injectQuery } from '@tanstack/angular-query-experimental'
import axios from 'axios'

type Response = {
  name: string
  description: string
  subscribers_count: number
  stargazers_count: number
  forks_count: number
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'simple-example',
  standalone: true,
  template: `
    <ng-container *ngIf="query().isPending">Loading...</ng-container>
    <ng-container *ngIf="query().error as error">
      An error has occurred: {{ error?.message }}
    </ng-container>
    <div *ngIf="query().data as data">
      <h1>{{ data.name }}</h1>
      <p>{{ data.description }}</p>
      <strong>👀 {{ data.subscribers_count }}</strong>
      <strong>✨ {{ data.stargazers_count }}</strong>
      <strong>🍴 {{ data.forks_count }}</strong>
    </div>
    <angular-query-devtools initialIsOpen />
  `,
  imports: [AngularQueryDevtoolsComponent, CommonModule],
})
export class SimpleExampleComponent {
  query = injectQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      axios
        .get('https://api.github.com/repos/tannerlinsley/react-query')
        .then((res) => res.data as Response),
  }))
}
```
