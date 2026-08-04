import {
	QueryClient,
	QueryClientProvider,
	useQuery,
} from '@tanstack/octane-query';

const client = new QueryClient();

export function Cached() @{
	const q = useQuery({
		queryKey: ['c'],
		queryFn: () => Promise.resolve('fetched'),
		initialData: 'seed',
		staleTime: Infinity,
	});
	<div id="d">{'data=' + q.data + ' status=' + q.status + ' pending=' + q.isPending + ' fetching=' +
		q.isFetching +
		' success=' +
		q.isSuccess as string}</div>
}

export function CachedApp() @{
	<QueryClientProvider client={client}>
		<Cached />
	</QueryClientProvider>
}
