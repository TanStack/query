---
id: testing
title: Testing
---

As there is currently no simple way to await a signal to reach a specific value we will use polling to wait in our test (instead of transforming our signals in observable and use RxJS features to filter the values). If you want to do like us for the polling you can use the angular testing library.

Install this by running:

```sh
ng add @testing-library/angular
```

Otherwise we recommend to use the toObservable feature from Angular.

## What to test

Because the recommendation is to use services that provide the Query options through function this is what we are going to do.

## A simple test

```ts
//tasks.service.ts
import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import {
  QueryClient,
  mutationOptions,
  queryOptions,
} from '@tanstack/angular-query-experimental'

import { lastValueFrom } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  #queryClient = inject(QueryClient) // Manages query state and caching
  #http = inject(HttpClient) // Handles HTTP requests

  /**
   * Fetches all tasks from the API.
   * Returns an observable containing an array of task strings.
   */
  allTasks = () =>
    queryOptions({
      queryKey: ['tasks'],
      queryFn: () => {
        return lastValueFrom(this.#http.get<Array<string>>('/api/tasks'));
      }
    })
}
```

```ts
// tasks.service.spec.ts
import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withFetch, withInterceptors } from "@angular/common/http";
import { QueryClient, injectQuery, provideTanStackQuery } from "@tanstack/angular-query-experimental";
import { Injector, inject, runInInjectionContext } from "@angular/core";
import { waitFor } from '@testing-library/angular';
import { mockInterceptor } from "../interceptor/mock-api.interceptor";
import { TasksService } from "./tasks.service";
import type { CreateQueryResult} from "@tanstack/angular-query-experimental";

describe('Test suite: TaskService', () => {
    let service!: TasksService;
    let injector!: Injector;
  
    // https://angular.dev/guide/http/testing
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withFetch(), withInterceptors([mockInterceptor])),
          TasksService,
          // It is recommended to cancel the retries in the tests
          provideTanStackQuery(new QueryClient({
            defaultOptions: {
              queries: {
                retry: false
              }
            }
          }))
        ]
      });
      service = TestBed.inject(TasksService);
      injector = TestBed.inject(Injector);
    });

    it('should get all the Tasks', () => {
      let allTasks: any;
      runInInjectionContext(injector, () => {
        allTasks = injectQuery(() => service.allTasks());
      });
      expect(allTasks.status()).toEqual('pending');
      expect(allTasks.isFetching()).toEqual(true);
      expect(allTasks.data()).toEqual(undefined);
      // We await the first result from the query
      await waitFor(() => expect(allTasks.isFetching()).toBe(false), {timeout: 10000});
      expect(allTasks.status()).toEqual('success');
      expect(allTasks.data()).toEqual([]); // Considering that the inteceptor is returning [] at the first query request.
      // To have a more complete example have a look at "unit testing / jest"
    });
});
```

```ts
// mock-api.interceptor.ts
/**
 * MockApiInterceptor is used to simulate API responses for `/api/tasks` endpoints.
 * It handles the following operations:
 * - GET: Fetches all tasks from sessionStorage.
 * - POST: Adds a new task to sessionStorage.
 * Simulated responses include a delay to mimic network latency.
 */
import { HttpResponse } from '@angular/common/http'
import { delay, of, throwError } from 'rxjs'
import type {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http'
import type { Observable } from 'rxjs'

export const mockInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {
  const respondWith = (status: number, body: any) =>
    of(new HttpResponse({ status, body })).pipe(delay(1000))
  if (req.url === '/api/tasks') {
    switch (req.method) {
      case 'GET':
        return respondWith(
          200,
          JSON.parse(
            sessionStorage.getItem('unit-testing-tasks') || '[]',
          ),
        )
      case 'POST':
        const tasks = JSON.parse(
          sessionStorage.getItem('unit-testing-tasks') || '[]',
        )
        tasks.push(req.body)
        sessionStorage.setItem(
          'unit-testing-tasks',
          JSON.stringify(tasks),
        )
        return respondWith(201, {
          status: 'success',
          task: req.body,
        })
    }
  }
  if (req.url === '/api/tasks-wrong-url') {
    return throwError(() => new Error('error')).pipe(delay(1000));
  }

  return next(req)
}
```

## Turn off retries

The library defaults to three retries with exponential backoff, which means that your tests are likely to timeout if you want to test an erroneous query. The easiest way to turn retries off is via the provideTanStackQuery during the TestBed setup as shown in the above example.

## Testing Network Calls

Instead of targetting a server for the data you should mock the requests. There are multiple way of handling the mocking, we recommend to use the Interceptor from Angular, see [here](https://angular.dev/guide/http/interceptors) for more details.
You can see the the Interceptor setup in the "Unit testing / Jest" examples.
