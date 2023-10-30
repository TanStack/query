// these custom query hooks required me to change some variable names and use the single object syntax
export function useDetails({ groupId }: { groupId?: string }): any {
  const cacheKey = ["details", groupId];
  const query = () => fetch(`/group/${groupId}`);
  const queryObject = useQuery(cacheKey, query, {
    enabled: !!groupId,
  });
  return queryObject;
}

export function useDetails2({ groupId }: { groupId?: string }): any {
  const cacheKey = ["details", groupId];
  const query = () => fetch(`/group/${groupId}`);
  const opts = { enabled: !!groupId }
  const queryObject = useQuery(cacheKey, query, opts);
  return queryObject;
}
