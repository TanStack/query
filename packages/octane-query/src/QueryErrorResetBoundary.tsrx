import { useState, isChildrenBlock } from 'octane';
import { QueryErrorResetBoundaryContext, createValue } from './errorResetBoundary.ts';
import type { OctaneNode } from 'octane';

type QueryErrorResetBoundaryProps = {
	children?: OctaneNode | ((value: ReturnType<typeof createValue>) => OctaneNode);
};

// QueryErrorResetBoundary — provides a fresh reset coordinator to its subtree.
// Place it above an error boundary; call `.reset()` from the boundary's retry so
// the query refetches instead of immediately re-throwing. Children may be a
// render prop receiving the boundary value — upstream's documented primary form:
// `<QueryErrorResetBoundary>{({ reset }) => <ErrorBoundary onReset={reset}…/>}
// </QueryErrorResetBoundary>` (react-query QueryErrorResetBoundary.tsx renders
// `typeof children === 'function' ? children(value) : children`; octane
// additionally excludes compiled children-blocks via isChildrenBlock).
export function QueryErrorResetBoundary(props: QueryErrorResetBoundaryProps) @{
	const [value] = useState(() => createValue());
	const resolved =
		typeof props.children === 'function' && !isChildrenBlock(props.children)
			? props.children(value)
			: props.children;
	<QueryErrorResetBoundaryContext.Provider
		value={value}
	>{resolved}</QueryErrorResetBoundaryContext.Provider>
}
