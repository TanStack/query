import { ErrorBoundary, Suspense, useState } from 'octane';
import {
	QueryClientProvider,
	QueryErrorResetBoundary,
	useQueryErrorResetBoundary,
	IsRestoringProvider,
	HydrationBoundary,
	useQuery,
	useQueries,
	useInfiniteQuery,
	useSuspenseQuery,
	useSuspenseInfiniteQuery,
	usePrefetchInfiniteQuery,
	useMutation,
	useMutationState,
	skipToken,
} from '@tanstack/octane-query';

// --- Suspense error retry loop (clearReset): a suspense query that ALWAYS
// fails. After reset()+retry the refetch fails again — the boundary must show
// the error again (not fall through and render undefined data). ---
function AlwaysFailReader(props: { queryFn: () => Promise<string> }) @{
	const q = useSuspenseQuery({ queryKey: ['fail'], queryFn: props.queryFn, retry: false });
	<span id="sq-data">{'data:' + q.data as string}</span>
}

function SuspenseRetryBoundary(props: { queryFn: () => Promise<string> }) @{
	const errReset = useQueryErrorResetBoundary();
	const onRetry = (reset: () => void) => () => {
		errReset.reset();
		reset();
	};
	<ErrorBoundary
		fallback={(e, reset) => <div id="sq-error">
			<span id="sq-msg">{(e as Error).message as string}</span>
			<button id="sq-retry" onClick={onRetry(reset)}>retry</button>
		</div>}
	>
		<Suspense fallback={<i id="sq-loading">loading</i>}>
			<AlwaysFailReader queryFn={props.queryFn} />
		</Suspense>
	</ErrorBoundary>
}

export function SuspenseRetryApp(props: { client: unknown; queryFn: () => Promise<string> }) @{
	<QueryClientProvider client={props.client}>
		<QueryErrorResetBoundary>
			<SuspenseRetryBoundary queryFn={props.queryFn} />
		</QueryErrorResetBoundary>
	</QueryClientProvider>
}

// --- QueryErrorResetBoundary render-prop children ---
export const renderPropValues: unknown[] = [];

export function RenderPropResetApp(props: { client: unknown }) @{
	<QueryClientProvider client={props.client}>
		<QueryErrorResetBoundary>
			{(value) => {
				renderPropValues.push(value);
				return <span id="rp-child">{'reset:' + typeof value.reset}</span>;
			}}
		</QueryErrorResetBoundary>
	</QueryClientProvider>
}

// --- HydrationBoundary ---
function HydratedReader(props: { queryKey: unknown[] }) @{
	const q = useQuery({ queryKey: props.queryKey, queryFn: skipToken });
	<span id="hydrated">{String(q.data ?? 'none') as string}</span>
}

export function HydrationApp(props: { client: unknown; state: unknown; queryKey: unknown[] }) @{
	<QueryClientProvider client={props.client}>
		<HydrationBoundary state={props.state}>
			<HydratedReader queryKey={props.queryKey} />
		</HydrationBoundary>
	</QueryClientProvider>
}

// --- experimental_prefetchInRender: expose result.promise ---
export const promiseCapture: { promise: Promise<unknown> | null } = { promise: null };

function PrefetchInRenderReader(props: { queryFn: () => Promise<string> }) @{
	const q = useQuery({
		queryKey: ['pir'],
		queryFn: props.queryFn,
		experimental_prefetchInRender: true,
		retry: false,
	});
	promiseCapture.promise = q.promise;
	<span id="pir">{(q.isPending ? 'pending' : 'data:' + q.data) as string}</span>
}

export function PrefetchInRenderApp(props: { client: unknown; queryFn: () => Promise<string> }) @{
	<QueryClientProvider client={props.client}>
		<PrefetchInRenderReader queryFn={props.queryFn} />
	</QueryClientProvider>
}

// --- useQueries combine ---
function CombineReader() @{
	const combined = useQueries({
		queries: [
			{ queryKey: ['c', 1], queryFn: () => Promise.resolve(1) },
			{ queryKey: ['c', 2], queryFn: () => Promise.resolve(2) },
		],
		combine: (results) => ({
			sum: results.reduce((acc: number, r: any) => acc + (r.data ?? 0), 0),
			allDone: results.every((r: any) => r.isSuccess),
		}),
	});
	<span id="combined">{combined.sum + ':' + combined.allDone}</span>
}

export function CombineApp(props: { client: unknown }) @{
	<QueryClientProvider client={props.client}>
		<CombineReader />
	</QueryClientProvider>
}

// --- skipToken: never fetches ---
export const skipTokenCalls = { count: 0 };

function SkipTokenReader() @{
	const q = useQuery({ queryKey: ['skip'], queryFn: skipToken });
	<span id="skip">{q.status + ':' + q.fetchStatus}</span>
}

export function SkipTokenApp(props: { client: unknown }) @{
	<QueryClientProvider client={props.client}>
		<SkipTokenReader />
	</QueryClientProvider>
}

// --- useInfiniteQuery: fetchNextPage ---
function InfiniteReader(props: { pageFn: (page: number) => Promise<string> }) @{
	const q = useInfiniteQuery({
		queryKey: ['inf'],
		queryFn: ({ pageParam }) => props.pageFn(pageParam as number),
		initialPageParam: 0,
		getNextPageParam: (_last: unknown, all: unknown[]) => (all.length < 3 ? all.length : undefined),
	});
	<div>
		<span id="pages">{(q.data ? q.data.pages.join(',') : 'none') as string}</span>
		<span id="has-next">{String(q.hasNextPage)}</span>
		<button id="next" onClick={() => q.fetchNextPage()}>next</button>
	</div>
}

export function InfiniteApp(props: {
	client: unknown;
	pageFn: (page: number) => Promise<string>;
}) @{
	<QueryClientProvider client={props.client}>
		<InfiniteReader pageFn={props.pageFn} />
	</QueryClientProvider>
}

// --- useSuspenseInfiniteQuery ---
function SuspenseInfiniteReader(props: { pageFn: (page: number) => Promise<string> }) @{
	const q = useSuspenseInfiniteQuery({
		queryKey: ['sinf'],
		queryFn: ({ pageParam }) => props.pageFn(pageParam as number),
		initialPageParam: 0,
		getNextPageParam: () => undefined,
	});
	<span id="sinf">{q.data.pages.join(',') as string}</span>
}

export function SuspenseInfiniteApp(props: {
	client: unknown;
	pageFn: (page: number) => Promise<string>;
}) @{
	<QueryClientProvider client={props.client}>
		<Suspense fallback={<i id="sinf-loading">loading</i>}>
			<SuspenseInfiniteReader pageFn={props.pageFn} />
		</Suspense>
	</QueryClientProvider>
}

// --- usePrefetchInfiniteQuery ---
function PrefetchInfinite(props: { pageFn: (page: number) => Promise<string> }) @{
	usePrefetchInfiniteQuery({
		queryKey: ['pinf'],
		queryFn: ({ pageParam }) => props.pageFn(pageParam as number),
		initialPageParam: 0,
	});
	<span id="pinf">{'prefetched'}</span>
}

export function PrefetchInfiniteApp(props: {
	client: unknown;
	pageFn: (page: number) => Promise<string>;
}) @{
	<QueryClientProvider client={props.client}>
		<PrefetchInfinite pageFn={props.pageFn} />
	</QueryClientProvider>
}

// --- useMutationState: filters + select ---
export const mutationCounter = { n: 0 };

function MutationStateReader(props: { mutationFn: (v: string) => Promise<string> }) @{
	const mutation = useMutation({ mutationKey: ['m1'], mutationFn: props.mutationFn });
	const variables = useMutationState({
		filters: { mutationKey: ['m1'] },
		select: (m) => m.state.variables,
	});
	<div>
		<button id="mutate" onClick={() => mutation.mutate('v-' + ++mutationCounter.n)}>go</button>
		<span id="vars">{variables.join(',') || 'none' as string}</span>
	</div>
}

export function MutationStateApp(props: {
	client: unknown;
	mutationFn: (v: string) => Promise<string>;
}) @{
	<QueryClientProvider client={props.client}>
		<MutationStateReader mutationFn={props.mutationFn} />
	</QueryClientProvider>
}

// --- Tracked props: a data-only reader must NOT re-render on isFetching flips ---
export const trackedRenders = { count: 0 };

function TrackedReader(props: { queryFn: () => Promise<string> }) @{
	trackedRenders.count++;
	const q = useQuery({ queryKey: ['tracked'], queryFn: props.queryFn, staleTime: 0 });
	<span id="tracked">{String(q.data ?? 'none') as string}</span>
}

export function TrackedApp(props: { client: unknown; queryFn: () => Promise<string> }) @{
	<QueryClientProvider client={props.client}>
		<TrackedReader queryFn={props.queryFn} />
	</QueryClientProvider>
}

// --- isRestoring flip: true → false starts the fetch ---
export const restoreSetter: { set: ((v: boolean) => void) | null } = { set: null };

function FlipRestoring(props: { queryFn: () => Promise<string> }) @{
	const [restoring, setRestoring] = useState(true);
	restoreSetter.set = setRestoring;
	<IsRestoringProvider value={restoring}>
		<RestoreFlipReader queryFn={props.queryFn} />
	</IsRestoringProvider>
}

function RestoreFlipReader(props: { queryFn: () => Promise<string> }) @{
	const q = useQuery({ queryKey: ['flip'], queryFn: props.queryFn, retry: false });
	<span id="flip">{(q.isPending ? 'pending' : 'data:' + q.data) as string}</span>
}

export function FlipRestoringApp(props: { client: unknown; queryFn: () => Promise<string> }) @{
	<QueryClientProvider client={props.client}>
		<FlipRestoring queryFn={props.queryFn} />
	</QueryClientProvider>
}
