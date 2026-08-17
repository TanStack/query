import {
	QueryClientProvider,
	useSuspenseQueries,
	useSuspenseQuery,
} from '@tanstack/octane-query';
import type { QueryClient } from '@tanstack/query-core';

type ReaderProps = {
	a: () => Promise<string>;
	b: () => Promise<string>;
};

type AppProps = ReaderProps & {
	client: QueryClient;
};

function QueryReader(props: ReaderProps) @{
	const a = useSuspenseQuery({
		queryKey: ['streaming-ssr', 'query', 'a'],
		queryFn: props.a,
		retry: false,
	});
	const b = useSuspenseQuery({
		queryKey: ['streaming-ssr', 'query', 'b'],
		queryFn: props.b,
		retry: false,
	});
	<span id="result">{a.data + '/' + b.data as string}</span>
}

function QueriesReader(props: ReaderProps) @{
	const [a] = useSuspenseQueries({
		queries: [
			{
				queryKey: ['streaming-ssr', 'queries', 'a'],
				queryFn: props.a,
				retry: false,
			},
		],
	});
	const [b] = useSuspenseQueries({
		queries: [
			{
				queryKey: ['streaming-ssr', 'queries', 'b'],
				queryFn: props.b,
				retry: false,
			},
		],
	});
	<span id="result">{a.data + '/' + b.data as string}</span>
}

function useWrappedQuery(
	key: 'a' | 'b',
	queryFn: () => Promise<string>,
) {
	return useSuspenseQuery({
		queryKey: ['streaming-ssr', 'wrapped-query', key],
		queryFn,
		retry: false,
	});
}

function WrappedQueryReader(props: ReaderProps) @{
	const a = useWrappedQuery('a', props.a);
	const b = useWrappedQuery('b', props.b);
	<span id="result">{a.data + '/' + b.data as string}</span>
}

export function StreamingSuspenseApp(props: AppProps & {
	mode: 'query' | 'queries';
}) @{
	const Reader = props.mode === 'query' ? QueryReader : QueriesReader;
	<QueryClientProvider client={props.client}>
		@try {
			<Reader a={props.a} b={props.b} />
		} @pending {
			<span id="pending">loading</span>
		}
	</QueryClientProvider>
}

export function WrappedStreamingSuspenseApp(props: AppProps) @{
	<QueryClientProvider client={props.client}>
		@try {
			<WrappedQueryReader a={props.a} b={props.b} />
		} @pending {
			<span id="pending">loading</span>
		}
	</QueryClientProvider>
}
