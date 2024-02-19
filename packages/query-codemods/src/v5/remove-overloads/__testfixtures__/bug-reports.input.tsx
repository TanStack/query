// From: https://github.com/TanStack/query/issues/6204
export function useDetails({ groupId }: { groupId?: string }): any {
  const cacheKey = ["details", groupId];
  const query = () => fetch(`/group/${groupId}`);
  const queryObject = useQuery(cacheKey, query, {
    enabled: !!groupId,
  });
  return queryObject;
}

// Based on: https://github.com/TanStack/query/issues/6204
export function useDetailsContainsIdentifierAsThirdArgument({ groupId }: { groupId?: string }): any {
  const cacheKey = ["details", groupId];
  const query = () => fetch(`/group/${groupId}`);
  const opts = { enabled: !!groupId }
  const queryObject = useQuery(cacheKey, query, opts);
  return queryObject;
}

// From: https://twitter.com/samcook_/status/1715063150184132902
export function useWhatever({ thing }: { thing: string }) {
  return useQuery(
    ['some-string', someVar],
    async () => 'foo',
    { enabled: Boolean(thing) },
  );
}
