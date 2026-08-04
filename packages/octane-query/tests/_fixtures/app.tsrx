import {
	QueryClientProvider,
	useQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/octane-query';

// Reads a query through the CONTEXT client (no explicit client arg).
export function Reader(props: { queryFn: () => Promise<string> }) @{
	const q = useQuery({ queryKey: ['k'], queryFn: props.queryFn, retry: false });
	<div id="status">{(q.isPending
		? 'pending'
		: q.isError
			? 'error:' + (q.error as Error).message
			: 'data:' + q.data) as string}</div>
}

export function App(props: { client: unknown; queryFn: () => Promise<string> }) @{
	<QueryClientProvider client={props.client}>
		<Reader queryFn={props.queryFn} />
	</QueryClientProvider>
}

// useQueryClient resolves the provided client.
export function ClientProbe(props: { onClient: (c: unknown) => void }) @{
	const client = useQueryClient();
	props.onClient(client);
	<span id="probe">ok</span>
}

export function ProbeApp(props: { client: unknown; onClient: (c: unknown) => void }) @{
	<QueryClientProvider client={props.client}>
		<ClientProbe onClient={props.onClient} />
	</QueryClientProvider>
}

// Mutation lifecycle.
export function Mutator(props: { mutationFn: (v: string) => Promise<string> }) @{
	const m = useMutation({ mutationFn: props.mutationFn });
	<div>
		<span id="mstatus">{(m.isIdle
			? 'idle'
			: m.isPending
				? 'pending'
				: m.isError
					? 'error'
					: 'data:' + m.data) as string}</span>
		<button id="go" onClick={() => m.mutate('x')}>go</button>
	</div>
}

export function MutApp(props: { client: unknown; mutationFn: (v: string) => Promise<string> }) @{
	<QueryClientProvider client={props.client}>
		<Mutator mutationFn={props.mutationFn} />
	</QueryClientProvider>
}
