// From: https://github.com/TanStack/query/issues/6204
export function useDetails({ groupId }: { groupId?: string }): any {
  const cacheKey = ["details", groupId];
  const query = () => fetch(`/group/${groupId}`);
  const queryObject = useQuery({
    queryKey: cacheKey,
    queryFn: query,
    enabled: !!groupId
  });
  return queryObject;
}

// Based on: https://github.com/TanStack/query/issues/6204
export function useDetailsContainsIdentifierAsThirdArgument({ groupId }: { groupId?: string }): any {
  const cacheKey = ["details", groupId];
  const query = () => fetch(`/group/${groupId}`);
  const opts = { enabled: !!groupId }
  const queryObject = useQuery({
    queryKey: cacheKey,
    queryFn: query,
    ...opts
  });
  return queryObject;
}

// From: https://twitter.com/samcook_/status/1715063150184132902
export function useWhatever({ thing }: { thing: string }) {
  return useQuery({
    queryKey: ['some-string', someVar],
    queryFn: async () => 'foo',
    enabled: Boolean(thing)
  });
}

// From: https://github.com/TanStack/query/issues/6548
export function useDeleteSomething(): any {
  return useMutation({
    mutationFn: ({ groupId }: { groupId: string }) => {
      return fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });
    }
  });
}

// From: https://github.com/TanStack/query/issues/6548
export function useDeleteSomethingWithOnError(): any {
  return useMutation({
    mutationFn: ({ groupId }: { groupId: string }) => {
      return fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });
    },

    onError: (_error, _variables, context) => {
      // An error happened!
      console.log(
        `rolling back optimistic delete with id ${context.id}`
      );
    }
  });
}

