import { ESLintUtils } from '@typescript-eslint/utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import {
  runLoaderCheck,
  runServerCheck,
} from '../../utils/prefetch-analysis/checks'
import { ModuleGraph } from '../../utils/prefetch-analysis/module-graph'
import { getNextCheck } from '../../utils/prefetch-analysis/next'
import {
  getReactRouterDataChecks,
  getReactRouterFrameworkCheck,
  isDataRouterCall,
} from '../../utils/prefetch-analysis/react-router'
import {
  getRouteDefinition,
  getTanStackRouterChecks,
} from '../../utils/prefetch-analysis/tanstack-router'
import { getWakuCheck } from '../../utils/prefetch-analysis/waku'
import type { TSESTree } from '@typescript-eslint/utils'
import type { Report } from '../../utils/prefetch-analysis/checks'
import type { RouteDefinition } from '../../utils/prefetch-analysis/tanstack-router'
import type { ExtraRuleDocs } from '../../types'

export const name = 'require-prefetch'

const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

export const rule = createRule({
  name,
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require queries used when a route renders to be prefetched by the route before it renders',
      recommended: 'error',
    },
    messages: {
      missingPrefetch:
        "The query '{{options}}' used by '{{hook}}'{{location}} isn't prefetched in {{site}}, so it only starts fetching after the component renders. Start it in {{site}} by passing the same query options to 'queryClient.{{method}}()'.",
      inlineQueryOptions:
        "Query options written inline{{location}} can't be matched with a prefetch in {{site}}. Move them into a 'queryOptions()' factory and start the same query in {{site}}.",
      notDehydrated:
        "The query '{{options}}' used by '{{hook}}'{{location}} is prefetched in {{site}}, but the component isn't rendered inside a '<HydrationBoundary state={dehydrate(queryClient)}>', so the prefetched data doesn't reach the client.",
      loaderNotDehydrated:
        "The query '{{options}}' used by '{{hook}}'{{location}} is only prefetched in a server 'loader' that doesn't call 'dehydrate(queryClient)', so the prefetched data doesn't reach the client. Return the dehydrated state and render it in a '<HydrationBoundary>', or prefetch in 'clientLoader'.",
      loaderNotHydrated:
        "The query '{{options}}' used by '{{hook}}'{{location}} is prefetched in a server 'loader' that calls 'dehydrate(queryClient)', but no '<HydrationBoundary>' renders this route's dehydrated state, so the prefetched data doesn't reach the client. Render the loader's dehydrated state in a '<HydrationBoundary>', or prefetch in 'clientLoader'.",
      clientQueryOptions:
        "'{{name}}' is imported from '{{file}}', which has a 'use client' directive, so on the server it is a client reference and can't be called. Move the query options to a module without 'use client'.",
      searchParamsMismatch:
        "The query '{{options}}' used by '{{hook}}'{{location}} reads a search param with 'useSearchParams()', which gives 'null' for a missing param, while {{site}} prefetches it with the param from 'searchParams', which gives 'undefined', so the queries can differ. Pass the param from {{site}} as a prop instead.",
    },
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    const graph = new ModuleGraph(context)
    const routes: Array<RouteDefinition> = []
    const dataRouters: Array<TSESTree.CallExpression> = []
    const reported = new Set<string>()

    const report = ({ node, messageId, data }: Report) => {
      const key = `${node.range.join(':')}|${messageId}|${data.options ?? data.name}|${data.location}`
      if (reported.has(key)) {
        return
      }
      reported.add(key)
      context.report({ node, messageId, data })
    }

    return {
      CallExpression(node) {
        const route = getRouteDefinition(node, graph)
        if (route !== null) {
          routes.push(route)
        }
        if (isDataRouterCall(node, graph)) {
          dataRouters.push(node)
        }
      },
      'Program:exit'() {
        if (routes.length > 0) {
          const { env, checks } = getTanStackRouterChecks(graph, routes)
          for (const check of checks) {
            runLoaderCheck(env, check, report)
          }
        }

        for (const router of dataRouters) {
          for (const { env, check } of getReactRouterDataChecks(
            graph,
            router,
          )) {
            runLoaderCheck(env, check, report)
          }
        }

        const reactRouter = getReactRouterFrameworkCheck(graph)
        if (reactRouter !== null) {
          runLoaderCheck(reactRouter.env, reactRouter.check, report)
        }

        const serverComponents = getNextCheck(graph) ?? getWakuCheck(graph)
        if (serverComponents !== null) {
          runServerCheck(serverComponents.env, serverComponents.check, report)
        }
      },
    }
  },
})
