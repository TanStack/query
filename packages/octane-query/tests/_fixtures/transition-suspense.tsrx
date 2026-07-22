import { useState, useTransition } from 'octane';
import { QueryClientProvider, useSuspenseQuery } from '@tanstack/octane-query';

// ---------------------------------------------------------------------------
// React useTransition + Suspense parity for useSuspenseQuery.
//
// A `useSuspenseQuery` whose queryKey depends on `value`. When `value` changes
// inside a transition, the query refetches under a NEW key and the reader
// re-suspends. The query observer notifies ASYNCHRONOUSLY (query-core's
// notifyManager uses setTimeout(0) — a macrotask), so by the time the re-render
// that re-suspends on the new in-flight fetch actually runs, octane's
// transition window has already closed and the re-render is URGENT.
//
// React keeps the previously committed content on screen until the new query
// resolves — it does NOT flash the Suspense fallback. This fixture lets the
// test drive that exact sequence: commit value=1, transition to value=2,
// observe the value=1 content holds, then resolves to value=2.
//
// `props.bindSetValue` captures the (transition-wrapped) value setter, and
// `props.queryFn(value)` returns a per-value promise the test controls.
// ---------------------------------------------------------------------------

function PendingProbe() @{
	const [isPending] = useTransition();
	<span id="pending">
		{isPending ? 'pending' : 'idle'}
	</span>
}

function Reader(props) @{
	const [value, setValue] = useState(1);
	const [, start] = useTransition();
	// Expose a transition-priority value setter to the test.
	props.bindSetValue((v) => start(() => setValue(v)));
	// Expose an URGENT (non-transition) value setter so the test can re-render the
	// reader under a new key WHILE the boundary is transition-held — modelling the
	// query observer's async macrotask notify, which lands at urgent priority.
	if (props.bindSetValueUrgent) props.bindSetValueUrgent((v) => setValue(v));
	const q = useSuspenseQuery({
		queryKey: ['transition-suspense', value],
		queryFn: () => props.queryFn(value),
		retry: false,
	});
	<span id="data">{'data:' + q.data as string}</span>
}

export function TransitionSuspenseApp(props) @{
	<QueryClientProvider client={props.client}>
		<div>
			<PendingProbe />
			@try {
				<Reader
					queryFn={props.queryFn}
					bindSetValue={props.bindSetValue}
					bindSetValueUrgent={props.bindSetValueUrgent}
				/>
			} @pending {
				<span id="fallback">loading</span>
			} @catch (e) {
				<span id="caught">{'caught:' + (e as Error).message as string}</span>
			}
		</div>
	</QueryClientProvider>
}
