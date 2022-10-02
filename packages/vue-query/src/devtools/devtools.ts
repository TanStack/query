/* istanbul ignore file */

import { setupDevtoolsPlugin } from '@vue/devtools-api'
import type { CustomInspectorNode } from '@vue/devtools-api'
import { matchSorter } from 'match-sorter'
import type { Query } from '@tanstack/query-core'
import type { QueryClient } from '../queryClient'
import {
  getQueryStateLabel,
  getQueryStatusBg,
  getQueryStatusFg,
  sortFns,
} from './utils'

const pluginId = 'vue-query'
const pluginName = 'Vue Query'

export function setupDevtools(app: any, queryClient: QueryClient) {
  setupDevtoolsPlugin(
    {
      id: pluginId,
      label: pluginName,
      packageName: 'vue-query',
      homepage: 'https://github.com/DamianOsipiuk/vue-query',
      logo: 'https://vue-query.vercel.app/vue-query.svg',
      app,
      settings: {
        baseSort: {
          type: 'choice',
          component: 'button-group',
          label: 'Sort Cache Entries',
          options: [
            {
              label: 'ASC',
              value: 1,
            },
            {
              label: 'DESC',
              value: -1,
            },
          ],
          defaultValue: 1,
        },
        sortFn: {
          type: 'choice',
          label: 'Sort Function',
          options: Object.keys(sortFns).map((key) => ({
            label: key,
            value: key,
          })),
          defaultValue: Object.keys(sortFns)[0]!,
        },
      },
    },
    (api) => {
      const queryCache = queryClient.getQueryCache()

      api.addInspector({
        id: pluginId,
        label: pluginName,
        icon: 'api',
        nodeActions: [
          {
            icon: 'cloud_download',
            tooltip: 'Refetch',
            action: (queryHash: string) => {
              queryCache.get(queryHash)?.fetch()
            },
          },
          {
            icon: 'alarm',
            tooltip: 'Invalidate',
            action: (queryHash: string) => {
              const query = queryCache.get(queryHash) as Query
              queryClient.invalidateQueries(query.queryKey)
            },
          },
          {
            icon: 'settings_backup_restore',
            tooltip: 'Reset',
            action: (queryHash: string) => {
              queryCache.get(queryHash)?.reset()
            },
          },
          {
            icon: 'delete',
            tooltip: 'Remove',
            action: (queryHash: string) => {
              const query = queryCache.get(queryHash) as Query
              queryCache.remove(query)
            },
          },
        ],
      })

      api.addTimelineLayer({
        id: pluginId,
        label: pluginName,
        color: 0xffd94c,
      })

      queryCache.subscribe((event) => {
        api.sendInspectorTree(pluginId)
        api.sendInspectorState(pluginId)

        if (
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          event &&
          ['queryAdded', 'queryRemoved', 'queryUpdated'].includes(event.type)
        ) {
          api.addTimelineEvent({
            layerId: pluginId,
            event: {
              title: event.type,
              subtitle: event.query.queryHash,
              time: api.now(),
              data: {
                queryHash: event.query.queryHash,
                ...event,
              },
            },
          })
        }
      })

      api.on.getInspectorTree((payload) => {
        if (payload.inspectorId === pluginId) {
          const queries: Query[] = queryCache.getAll()
          const settings = api.getSettings()
          const filtered = matchSorter(queries, payload.filter, {
            keys: ['queryHash'],
            baseSort: (a, b) =>
              sortFns[settings.sortFn]!(a.item, b.item) * settings.baseSort,
          })

          const nodes: CustomInspectorNode[] = filtered.map((query) => {
            const stateLabel = getQueryStateLabel(query)

            return {
              id: query.queryHash,
              label: query.queryHash,
              tags: [
                {
                  label: `${stateLabel} [${query.getObserversCount()}]`,
                  textColor: getQueryStatusFg(query),
                  backgroundColor: getQueryStatusBg(query),
                },
              ],
            }
          })
          payload.rootNodes = nodes
        }
      })

      api.on.getInspectorState((payload) => {
        if (payload.inspectorId === pluginId) {
          const query = queryCache.get(payload.nodeId)

          if (!query) {
            return
          }

          payload.state = {
            ' Query Details': [
              {
                key: 'Query key',
                value: query.queryHash as string,
              },
              {
                key: 'Query status',
                value: getQueryStateLabel(query),
              },
              {
                key: 'Observers',
                value: query.getObserversCount(),
              },
              {
                key: 'Last Updated',
                value: new Date(query.state.dataUpdatedAt).toLocaleTimeString(),
              },
            ],
            'Data Explorer': [
              {
                key: 'Data',
                value: query.state.data,
              },
            ],
            'Query Explorer': [
              {
                key: 'Query',
                value: query,
              },
            ],
          }
        }
      })
    },
  )
}
