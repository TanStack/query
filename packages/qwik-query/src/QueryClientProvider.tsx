import {
	Slot,
	component$,
	useVisibleTask$
} from '@builder.io/qwik';
import { getQueryClient } from './useQueryClient';

export default component$(() => {
	useVisibleTask$(({ cleanup }) => {
		const queryClient = getQueryClient();
		queryClient.mount();
		cleanup(() => {
			queryClient.unmount();
		});
	});
	return <Slot />;
});
