import { Suspense } from 'octane';
import { QueryClientProvider, useQuery, useSuspenseQueries } from '@tanstack/octane-query';

// A suspense query: throws its in-flight promise (→ @pending) and, on error,
// throws the error (→ @catch).
export function SuspendingReader(props: { queryFn: () => Promise<string> }) @{
	const q = useQuery({ queryKey: ['s'], queryFn: props.queryFn, suspense: true, retry: false });
	<span id="data">{'data:' + q.data as string}</span>
}

export function SuspenseApp(props: { client: unknown; queryFn: () => Promise<string> }) @{
	<QueryClientProvider client={props.client}>
		@try {
			<SuspendingReader queryFn={props.queryFn} />
		} @pending {
			<span id="fallback">loading</span>
		} @catch (e) {
			<span id="caught">{'caught:' + (e as Error).message as string}</span>
		}
	</QueryClientProvider>
}

// The react-query-idiomatic form: octane's <Suspense> component (not @try) wraps a
// suspense query.
export function SuspenseComponentApp(props: { client: unknown; queryFn: () => Promise<string> }) @{
	<QueryClientProvider client={props.client}>
		<Suspense fallback={<span id="fallback">loading</span>}>
			<SuspendingReader queryFn={props.queryFn} />
		</Suspense>
	</QueryClientProvider>
}

function SuspenseQueriesReader(props: { a: () => Promise<string>; b: () => Promise<string> }) @{
	const results = useSuspenseQueries({
		queries: [
			{ queryKey: ['sq', 'a'], queryFn: props.a },
			{ queryKey: ['sq', 'b'], queryFn: props.b },
		],
	});
	<span id="data">{'data:' + results[0].data + '/' + results[1].data as string}</span>
}

export function SuspenseQueriesApp(props: {
	client: unknown;
	a: () => Promise<string>;
	b: () => Promise<string>;
}) @{
	<QueryClientProvider client={props.client}>
		<Suspense fallback={<span id="fallback">loading</span>}>
			<SuspenseQueriesReader a={props.a} b={props.b} />
		</Suspense>
	</QueryClientProvider>
}
