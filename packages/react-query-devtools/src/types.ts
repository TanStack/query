import type { Query, DefaultError } from '@tanstack/react-query'

export interface DevToolsErrorType {
  /**
   * The name of the error.
   */
  name: string
  /**
   * How the error is initialized.
   */
  initializer: (query: Query) => DefaultError
}
