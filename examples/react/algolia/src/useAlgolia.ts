import { useInfiniteQuery } from "@tanstack/react-query";
import { search } from "./algolia";

export type UseAlgoliaOptions = {
  indexName: string;
  query: string;
  hitsPerPage?: number;
  staleTime?: number;
  cacheTime?: number;
  enabled?: boolean;
};

export default function useAlgolia<TData>({
  indexName,
  query,
  hitsPerPage = 10,
  staleTime,
  cacheTime,
  enabled,
}: UseAlgoliaOptions) {
  const queryInfo = useInfiniteQuery({
    queryKey: ["algolia", indexName, query, hitsPerPage],
    queryFn: ({ pageParam }) =>
      search<TData>({ indexName, query, pageParam, hitsPerPage }),
    getNextPageParam: (lastPage) => lastPage?.nextPage,
    staleTime,
    cacheTime,
    enabled,
  });

  const hits = queryInfo.data?.pages.map((page) => page.hits).flat();

  return { ...queryInfo, hits };
}
