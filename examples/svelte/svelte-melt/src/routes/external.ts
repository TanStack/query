import { createQuery } from '@tanstack/svelte-query-runes/dev';

export function useQuery(props) {
	return createQuery({
		queryKey: ['eternal', props],
		queryFn: () => {
			return Date.now();
		},
		enabled: props.paginate.page > 0
	});
}
