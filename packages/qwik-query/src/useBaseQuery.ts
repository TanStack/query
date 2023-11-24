import {
	noSerialize,
	useSignal,
	useStore,
	useVisibleTask$,
	type NoSerialize,
} from '@builder.io/qwik';
import type {
	DefaultedQueryObserverOptions,
	QueryKey} from '@tanstack/query-core';
import {
	InfiniteQueryObserver,
	QueryClient,
	QueryObserver,
	hydrate,
	notifyManager,
	type DehydratedState,
} from '@tanstack/query-core';
import type { QueryStore } from './types';
import { createQueryClient } from './useQueryClient';

export enum ObserverType {
	base,
	inifinite,
}

export const useBaseQuery = (
	observerType: ObserverType,
	options: any,
	// | DefaultedQueryObserverOptions<unknown, Error, unknown, unknown, QueryKey>
	// | InfiniteQueryObserverOptions<unknown, Error, unknown, unknown, QueryKey>,
	initialState?: DehydratedState
) => {
	const queryClient = new QueryClient();
	if (initialState) {
		hydrate(queryClient, initialState);
	}
	const store = useStore<any>({
		//QueryStore
		result: initialState
			? queryClient.getQueryState(options.queryKey || [])
			: undefined,
		options,
	});
	const observerSig = useSignal<NoSerialize<QueryObserver>>();

	useVisibleTask$(
		({ cleanup }) => {
			const { observer, unsubscribe, defaultedOptions } = createQueryObserver(
				store,
				options,
				observerType
			);
			observerSig.value = observer;
			store.options = defaultedOptions;

			cleanup(unsubscribe);
		},
	);

	useVisibleTask$(({ track }) => {
		track(() => store.options);
		if (observerSig.value) {
			observerSig.value.setOptions(store.options || options);
		}
	});

	return store;
};

const createQueryObserver = (
	store: QueryStore,
	options: DefaultedQueryObserverOptions<
		unknown,
		Error,
		unknown,
		unknown,
		QueryKey
	>,
	observerType: ObserverType
) => {
	const Observer =
		observerType === ObserverType.base
			? QueryObserver
			: (InfiniteQueryObserver as typeof QueryObserver);
	const client = createQueryClient();

	const defaultedOptions = client.defaultQueryOptions(options);
	defaultedOptions._optimisticResults = 'optimistic';
	defaultedOptions.structuralSharing = false;

	const observer = new Observer(client, defaultedOptions);
	if (!store.result) {
		const result = observer.getOptimisticResult(defaultedOptions);
		patchAndAssignResult(
			observerType,
			store,
			result,
			defaultedOptions,
			observer
		);
	}

	const unsubscribe = observer.subscribe(
		notifyManager.batchCalls((result: any) => {
			patchAndAssignResult(
				observerType,
				store,
				result,
				defaultedOptions,
				observer
			);
		})
	);

	return { observer: noSerialize(observer), unsubscribe, defaultedOptions };
};

const patchAndAssignResult = async (
	observerType: any,
	store: any,
	result: any,
	defaultedOptions: any,
	observer: any
) => {
	if (observerType === ObserverType.inifinite) {
		result.hasPreviousPage = await hasPage(
			store.options,
			result.data.pages,
			'PREV'
		);
		result.hasNextPage = await hasPage(
			store.options,
			result.data.pages,
			'NEXT'
		);
	}
	store.result = !defaultedOptions.notifyOnChangeProps
		? noSerialize(observer.trackResult(result))
		: noSerialize(result);
};

const hasPage = async (options: any, pages: any, dicrection: 'PREV' | 'NEXT') => {
	const getPageParam =
		dicrection === 'PREV'
			? options.getPreviousPageParam
			: options.getNextPageParam;
	if (getPageParam && Array.isArray(pages)) {
		const pageParam = await getPageParam(dicrection === 'PREV' ? pages[0] : pages[pages.length - 1], pages);
		console.log('pageParam', pageParam, dicrection)
		return (
			typeof pageParam !== 'undefined' &&
			pageParam !== null &&
			pageParam !== false
		);
	}
	return;
};
