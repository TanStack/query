import type { NoSerialize } from '@builder.io/qwik';
import {
	noSerialize,
	useSignal,
	useStore,
	useVisibleTask$,
} from '@builder.io/qwik';
import { MutationObserver, notifyManager } from '@tanstack/query-core';
import { createQueryClient } from './useQueryClient';

export function useMutation(options: any) {
	const store = useStore<any>({});
	const observerSig = useSignal<NoSerialize<MutationObserver>>();

	useVisibleTask$(({ cleanup }) => {
		const { observer, unsubscribe } = createMutationObserver(store, options);
		observerSig.value = observer;

		cleanup(unsubscribe);
	});

	useVisibleTask$(({ track }) => {
		track(() => store.options);
		if (observerSig.value) {
			observerSig.value.setOptions(options);
		}
	});

	return store;
}

const createMutationObserver = (store: any, options: any) => {
	const client = createQueryClient();
	const observer = new MutationObserver(client, options);

	const unsubscribe = observer.subscribe(
		notifyManager.batchCalls((result: any) => {
			store.result = noSerialize(observer.getCurrentResult());
			store.mutateAsync = noSerialize(result.mutate);
		})
	);

	store.mutate = noSerialize((variables: any, mutateOptions: any) => {
		observer.mutate(variables, mutateOptions).catch(() => {});
	});

	return { observer: noSerialize(observer), unsubscribe };
};
