import {
  QueryClient as PluggableQueryClient,
  infiniteQueryPlugin,
  mutationPlugin,
} from '../src/runtime/index'
import type { QueryClientConfig } from '../src/runtime/index'

/** Runs the upstream suites against a client with the full upstream feature set. */
export class QueryClient extends PluggableQueryClient {
  constructor(config?: QueryClientConfig) {
    super({ ...config, plugins: [mutationPlugin, infiniteQueryPlugin] })
  }
}

export type AdapterClientOptions = 'plugins'
