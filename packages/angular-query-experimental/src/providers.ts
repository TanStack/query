import {
  DestroyRef,
  ENVIRONMENT_INITIALIZER,
  inject,
  makeEnvironmentProviders,
} from '@angular/core'
import { provideQueryClient } from './inject-query-client'
import type { EnvironmentProviders } from '@angular/core'
import type { QueryClient } from '@tanstack/query-core'

/**
 * Sets up providers necessary to enable TanStack Query functionality for Angular applications.
 *
 * Allows to configure a `QueryClient`.
 *
 * **Example - standalone**
 *
 * ```ts
 * import {
 *   provideAngularQuery,
 *   QueryClient,
 * } from '@tanstack/angular-query-experimental'
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [provideAngularQuery(new QueryClient())],
 * })
 * ```
 *
 * **Example - NgModule-based**
 *
 * ```ts
 * import {
 *   provideAngularQuery,
 *   QueryClient,
 * } from '@tanstack/angular-query-experimental'
 *
 * @NgModule({
 *   declarations: [AppComponent],
 *   imports: [BrowserModule],
 *   providers: [provideAngularQuery(new QueryClient())],
 *   bootstrap: [AppComponent],
 * })
 * export class AppModule {}
 * ```
 * @param queryClient - A `QueryClient` instance.
 * @returns A set of providers to set up TanStack Query.
 * @public
 * @see https://tanstack.com/query/v5/docs/framework/angular/quick-start
 */
export function provideAngularQuery(
  queryClient: QueryClient,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideQueryClient(queryClient),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        queryClient.mount()
        // Unmount the query client on application destroy
        inject(DestroyRef).onDestroy(() => queryClient.unmount())
      },
    },
  ])
}
