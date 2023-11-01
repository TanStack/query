import { setupDevtoolsPlugin } from '@vue/devtools-api'
import { rankItem } from '@tanstack/match-sorter-utils'
import { onlineManager } from '@tanstack/query-core'
import {
  getQueryStateLabel,
  getQueryStatusBg,
  getQueryStatusFg,
  sortFns,
} from './utils'
import type { CustomInspectorNode } from '@vue/devtools-api'
import type { Query, QueryCacheNotifyEvent } from '@tanstack/query-core'
import type { QueryClient } from '../queryClient'

const pluginId = 'vue-query'
const pluginName = 'Vue Query'

export function setupDevtools(app: any, queryClient: QueryClient) {
  setupDevtoolsPlugin(
    {
      id: pluginId,
      label: pluginName,
      packageName: 'vue-query',
      homepage: 'https://tanstack.com/query/latest',
      logo: 'https://raw.githubusercontent.com/TanStack/query/main/packages/vue-query/media/vue-query.svg',
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
        onlineMode: {
          type: 'choice',
          component: 'button-group',
          label: 'Online mode',
          options: [
            {
              label: 'Online',
              value: 1,
            },
            {
              label: 'Offline',
              value: 0,
            },
          ],
          defaultValue: 1,
        },
      },
    },
    (api) => {
      const initialSettings = api.getSettings()
      onlineManager.setOnline(Boolean(initialSettings.onlineMode.valueOf()))

      const queryCache = queryClient.getQueryCache()

      api.addInspector({
        id: pluginId,
        label: pluginName,
        icon: 'api',
        nodeActions: [
          {
            icon: 'file_download',
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
              queryClient.invalidateQueries(query)
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
          {
            icon: 'hourglass_empty',
            tooltip: 'Force loading',
            action: (queryHash: string) => {
              const query = queryCache.get(queryHash) as Query

              query.setState({
                data: undefined,
                status: 'pending',
              })
            },
          },
          {
            icon: 'error_outline',
            tooltip: 'Force error',
            action: (queryHash: string) => {
              const query = queryCache.get(queryHash) as Query

              query.setState({
                data: undefined,
                status: 'error',
                error: new Error('Unknown error from devtools'),
              })
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

        const queryEvents: Array<QueryCacheNotifyEvent['type']> = [
          'added',
          'removed',
          'updated',
        ]

        if (queryEvents.includes(event.type)) {
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

      api.on.setPluginSettings((payload) => {
        if (payload.key === 'onlineMode') {
          onlineManager.setOnline(Boolean(payload.newValue))
        }
      })

      api.on.getInspectorTree((payload) => {
        if (payload.inspectorId === pluginId) {
          const queries = queryCache.getAll()
          const settings = api.getSettings()

          const filtered = payload.filter
            ? queries.filter(
                (item) => rankItem(item.queryHash, payload.filter).passed,
              )
            : [...queries]

          const sorted = filtered.sort(
            (a, b) => sortFns[settings.sortFn]!(a, b) * settings.baseSort,
          )

          const nodes: Array<CustomInspectorNode> = sorted.map((query) => {
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
                value: query.queryHash,
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
