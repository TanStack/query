// HydrationBoundary — hydrates dehydrated query state into the client, then
// renders its children. Full port of react-query's HydrationBoundary.tsx:
//
//  - NEW queries hydrate IN RENDER (after SSR, hydration must land before the
//    children render; during a transition, prerender as much as is safe).
//  - EXISTING queries hydrate in an EFFECT: during a transition we must not
//    update live queries/observers until the transition commits — an aborted
//    transition must not clobber committed data (octane has transitions, so
//    upstream's abort-safety applies here too).
//  - A dehydrated query counts as NEWER than the cache when its dataUpdatedAt
//    is ahead, OR when it carries a streaming `promise` and was dehydrated
//    after the cached data settled (`dehydratedAt > dataUpdatedAt`) — that's
//    what lets later stream chunks re-hydrate an already-settled query.
import { useRef, useMemo, useEffect } from 'octane';
import { hydrate } from '@tanstack/query-core';
import { resolveClient } from './context.ts';
import type { OctaneNode } from 'octane';
import type { DehydratedState, HydrateOptions, QueryClient } from '@tanstack/query-core';

type HydrationBoundaryProps = {
	state?: unknown;
	options?: HydrateOptions;
	queryClient?: QueryClient;
	children?: OctaneNode;
};

export function HydrationBoundary(props: HydrationBoundaryProps) @{
	const client = resolveClient(props.queryClient);
	const state = props.state;

	const optionsRef = useRef(props.options);
	useEffect(() => {
		optionsRef.current = props.options;
	});

	// "In render" on purpose (the memo is a perf cache, not a semantic barrier) —
	// hydrate new queries now, queue existing ones for the commit effect.
	const hydrationQueue = useMemo(() => {
		if (state && typeof state === 'object') {
			const queryCache = client.getQueryCache();
			const queries = (state as DehydratedState).queries || [];

			const newQueries = [];
			const existingQueries = [];
			for (const dehydratedQuery of queries) {
				const existingQuery = queryCache.get(dehydratedQuery.queryHash);
				if (!existingQuery) {
					newQueries.push(dehydratedQuery);
				} else {
					const hydrationIsNewer =
						dehydratedQuery.state.dataUpdatedAt > existingQuery.state.dataUpdatedAt ||
							dehydratedQuery.promise && existingQuery.state.status !== 'pending' &&
								existingQuery.state.fetchStatus !== 'fetching' &&
								dehydratedQuery.dehydratedAt !== undefined &&
								dehydratedQuery.dehydratedAt > existingQuery.state.dataUpdatedAt;
					if (hydrationIsNewer) {
						existingQueries.push(dehydratedQuery);
					}
				}
			}

			if (newQueries.length > 0) {
				// hydrate() is idempotent for queries — safe to run in render.
				hydrate(client, { queries: newQueries }, optionsRef.current);
			}
			if (existingQueries.length > 0) {
				return existingQueries;
			}
		}
		return undefined;
	}, [client, state]);

	// Existing-query hydration lands at commit time (transition abort-safe).
	useEffect(() => {
		if (hydrationQueue) {
			hydrate(client, { queries: hydrationQueue }, optionsRef.current);
		}
	}, [client, hydrationQueue]);

	<>
		{props.children}
	</>
}
