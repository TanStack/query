import { useState } from 'octane';
import {
	QueryClient,
	QueryClientProvider,
	useMutation,
	useQuery,
} from '@tanstack/octane-query';

function delayed<T>(value: T, ms: number): Promise<T> {
	return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function AsyncReader() @{
	const q = useQuery({
		queryKey: ['a'],
		queryFn: () => delayed('fetched', 10),
		retry: false,
	});
	<div id="d">{'data=' + q.data + ' status=' + q.status + ' pending=' + q.isPending + ' fetching=' +
		q.isFetching +
		' success=' +
		q.isSuccess as string}</div>
}

export function AsyncApp() @{
	const [client] = useState(
		() => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
	);
	<QueryClientProvider client={client}>
		<AsyncReader />
	</QueryClientProvider>
}

function MutationReader() @{
	const mutation = useMutation({
		mutationFn: (value: string) => delayed('done:' + value, 10),
	});
	<div>
		<button id="go" onClick={() => mutation.mutate('x')}>go</button>
		<div id="m">{'status=' + mutation.status + ' data=' + mutation.data + ' vars=' +
			mutation.variables as string}</div>
	</div>
}

export function MutationApp() @{
	const [client] = useState(() => new QueryClient());
	<QueryClientProvider client={client}>
		<MutationReader />
	</QueryClientProvider>
}
