import { useEffect } from 'octane';
import { QueryClientContext } from './context.ts';
import type { OctaneNode } from 'octane';
import type { QueryClient } from '@tanstack/query-core';

type QueryClientProviderProps = {
	client: QueryClient;
	children?: OctaneNode;
};

// QueryClientProvider — provides the QueryClient via context and mounts/unmounts
// it with the component. It's authored in .tsrx because it's a COMPONENT that
// renders a context Provider with children + a mount effect, which only the
// octane compiler can emit (the binding's hooks stay plain TS).
export function QueryClientProvider(props: QueryClientProviderProps) @{
	useEffect(() => {
		props.client.mount();
		return () => {
			props.client.unmount();
		};
	}, [props.client]);
	<QueryClientContext.Provider value={props.client}>{props.children}</QueryClientContext.Provider>
}
