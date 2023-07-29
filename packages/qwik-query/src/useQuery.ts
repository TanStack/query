import type { DehydratedState } from '@tanstack/query-core';
import { ObserverType, useBaseQuery } from './useBaseQuery';

export const useQuery = (options: any, initialState?: DehydratedState) => {
	return useBaseQuery(ObserverType.base, options, initialState);
};
