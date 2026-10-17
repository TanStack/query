import { makeEnvironmentProviders } from '@angular/core'
import { queryFeature } from '@tanstack/angular-query/internal'
import type { DevtoolsOptions, WithDevtools, WithDevtoolsFn } from './types'

// Stub which replaces `withDevtools` in production builds
/**
 * Provides an inert Query feature for production builds.
 * @returns A feature that creates no devtools or subscriptions.
 */
export const withDevtools: WithDevtools = () =>
  queryFeature(makeEnvironmentProviders([]))

export type { DevtoolsOptions, WithDevtools, WithDevtoolsFn }
