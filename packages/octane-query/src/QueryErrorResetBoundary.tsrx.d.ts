import type { ComponentBody } from 'octane'
import type {
  QueryErrorResetBoundaryFunction,
  QueryErrorResetBoundaryProps,
} from './types'

export interface QueryErrorResetBoundaryComponent extends ComponentBody<QueryErrorResetBoundaryProps> {
  (props: { children: QueryErrorResetBoundaryFunction }): void
}

export declare const QueryErrorResetBoundary: QueryErrorResetBoundaryComponent
