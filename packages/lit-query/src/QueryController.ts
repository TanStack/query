import { QueryObserver } from '@tanstack/query-core'
import { getQueryClient } from './queryClientHelper'
import type {
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { ReactiveController, ReactiveControllerHost } from 'lit'

export type { QueryObserverOptions }

/**
 * QueryController is a class that integrates a query-based data fetching system
 * into a Lit component as a ReactiveController.
 *
 * @template TQueryFnData - The data type returned by the query function.
 * @template TError - The error type for query errors.
 * @template TData - The data type to be used in the component.
 * @template TQueryData - The data type returned by the query (may differ from TData).
 * @template TQueryKey - The query key type.
 */
export class QueryController<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> implements ReactiveController
{
  /**
   * The result of the query observer, containing data and error information.
   */
  result: QueryObserverResult<TData, TError>

  /**
   * The internal query observer responsible for managing the query.
   */
  private queryObserver: QueryObserver<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >

  /**
   * Creates a new QueryController instance.
   *
   * @param host - The host component to which this controller is added.
   * @param options - A function that provides QueryObserverOptions for the query.
   * @link [QueryObserverOptions API Docs](). //TODO: Add the correct doc
   */
  constructor(
    private host: ReactiveControllerHost,
    private options: () => QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ) {
    this.host.addController(this)

    // Initialize the QueryObserver with default options.
    const queryClient = getQueryClient()
    const defaultOption = this.getDefaultOptions()
    this.queryObserver = new QueryObserver(queryClient, defaultOption)

    // Get an optimistic result based on the default options.
    this.result = this.queryObserver.getOptimisticResult(defaultOption)
  }

  /**
   * Unsubscribe function to remove the observer when the component disconnects.
   */
  private unsubscribe() {
    // We set the unsubscribe function when hostConnected is invoked
  }

  /**
   * Invoked when the host component updates.
   * Updates the query observer options with default options.
   */
  hostUpdate() {
    const defaultOption = this.getDefaultOptions()
    this.queryObserver.setOptions(defaultOption)
  }

  /**
   * Invoked when the host component is connected.
   * Subscribes to the query observer and updates the result.
   */
  hostConnected() {
    this.unsubscribe = this.queryObserver.subscribe((result) => {
      this.result = result
      this.host.requestUpdate()
    })
  }

  /**
   * Invoked when the host component is disconnected.
   * Unsubscribes from the query observer to clean up.
   */
  hostDisconnected() {
    this.unsubscribe()
  }

  /**
   * Retrieves the default query options by combining the user-provided options
   * with the default options from the query client.
   *
   * @returns The default query options.
   */
  private getDefaultOptions() {
    const queryClient = getQueryClient()
    const defaultOption = queryClient.defaultQueryOptions(this.options())
    return defaultOption
  }
}
