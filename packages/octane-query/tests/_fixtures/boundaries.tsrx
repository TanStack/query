import { ErrorBoundary } from 'octane';
import {
	QueryClientProvider,
	QueryErrorResetBoundary,
	useQueryErrorResetBoundary,
	IsRestoringProvider,
	useQuery,
} from '@tanstack/octane-query';

// --- IsRestoring: a restoring subtree reads cache but doesn't subscribe/fetch ---
function RestoreReader(props: { queryFn: () => Promise<string> }) @{
	const q = useQuery({ queryKey: ['r'], queryFn: props.queryFn, retry: false });
	<div id="status">{(q.isPending ? 'pending' : 'data:' + q.data) as string}</div>
}

export function RestoringApp(props: {
	client: unknown;
	restoring: boolean;
	queryFn: () => Promise<string>;
}) @{
	<QueryClientProvider client={props.client}>
		<IsRestoringProvider value={props.restoring}>
			<RestoreReader queryFn={props.queryFn} />
		</IsRestoringProvider>
	</QueryClientProvider>
}

// --- QueryErrorResetBoundary: reset() lets a throwOnError query retry ---
function ErrReader(props: { queryFn: () => Promise<string> }) @{
	const q = useQuery({ queryKey: ['e'], queryFn: props.queryFn, retry: false, throwOnError: true });
	<span id="data">{'data:' + q.data as string}</span>
}

function Boundary(props: { queryFn: () => Promise<string> }) @{
	const errReset = useQueryErrorResetBoundary();
	const onRetry = (reset: () => void) => () => {
		errReset.reset();
		reset();
	};
	<ErrorBoundary
		fallback={(e, reset) => <button id="retry" onClick={onRetry(reset)}>retry</button>}
	>
		<ErrReader queryFn={props.queryFn} />
	</ErrorBoundary>
}

export function ResetApp(props: { client: unknown; queryFn: () => Promise<string> }) @{
	<QueryClientProvider client={props.client}>
		<QueryErrorResetBoundary>
			<Boundary queryFn={props.queryFn} />
		</QueryErrorResetBoundary>
	</QueryClientProvider>
}
