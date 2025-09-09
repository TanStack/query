import { infiniteQueryOptions , useInfiniteQuery } from '@tanstack/vue-query'
import { computed } from "vue";

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const options = {
  queryKey: ['infiniteQuery'],
  queryFn: () => sleep(0).then(() => 'Some data'),
  getNextPageParam: () => undefined,
  initialPageParam: 0,
};
const optionsComputed = computed(() => options);
const optionsWrapped = infiniteQueryOptions(options);
const optionsWrappedComputed = computed(() => infiniteQueryOptions(options));

const query1 = useInfiniteQuery(options);
const query3 = useInfiniteQuery(optionsComputed);
const query2 = useInfiniteQuery(optionsWrapped);
const query4 = useInfiniteQuery(optionsWrappedComputed);
