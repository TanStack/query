import {
	Slot,
	component$,
	useVisibleTask$
} from '@builder.io/qwik';
import { createQueryClient } from './useQueryClient';

export default component$(() => {
	useVisibleTask$(({ cleanup }) => {
		const queryClient = createQueryClient();
		queryClient.mount();
		cleanup(() => {
			queryClient.unmount();
		});
	});
	return <Slot />;
});
