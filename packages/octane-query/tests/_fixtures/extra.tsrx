import { QueryClientProvider, useQuery } from '@tanstack/octane-query';

// queryKey derived from a prop — changing the prop swaps the query (exercises
// observer.setOptions → query change → refetch → re-render).
export function KeyedReader(props: { k: number }) @{
	const q = useQuery({
		queryKey: ['keyed', props.k],
		queryFn: () => Promise.resolve('v' + props.k),
		retry: false,
		staleTime: Infinity,
	});
	<div id="status">{(q.isPending ? 'pending' : 'data:' + q.data) as string}</div>
}

export function KeyedApp(props: { client: unknown; k: number }) @{
	<QueryClientProvider client={props.client}>
		<KeyedReader k={props.k} />
	</QueryClientProvider>
}
