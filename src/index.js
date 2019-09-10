import React from "react";
import JSONStableStringify from 'fast-json-stable-stringify'

const context = React.createContext();

export function ReactQueryProvider({ children, config = {} }) {
  const metaRef = React.useRef({});

  const [state, setState] = React.useState({});

  const configRef = React.useRef({});
  configRef.current = {
    retry: 3,
    retryDelay: attempt =>
      Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    defaultMerge: (old, data) => [...old, ...data],
    cacheTime: 60 * 1000,
    ...config
  };

  const contextValue = React.useMemo(
    () => [state, setState, metaRef, configRef],
    [state]
  );
  return <context.Provider value={contextValue}>{children}</context.Provider>;
}

let uid = 0;
const queryIDsByQuery = new Map();

function getQueryID(query) {
  // Get a query ID for this query function
  let queryID = queryIDsByQuery.get(query);
  // Make the queryID if necessary
  if (!queryID) {
    queryIDsByQuery.set(query, uid++);
    queryID = queryIDsByQuery.get(query);
  }

  return queryID;
}

function getQueryInfo({ query, variables: variablesObj, cacheBuster = "" }) {
  const queryID = getQueryID(query);
  const variablesHash = JSONStableStringify(variablesObj);
  return [
    [queryID, variablesHash, cacheBuster].join(""),
    queryID,
    variablesHash
  ];
}

function useVariables(variablesObj) {
  const stringified = JSONStableStringify(variablesObj);
  // eslint-disable-next-line
  return React.useMemo(() => variablesObj, [stringified]);
}

function useSharedQuery({
  query,
  variables: variablesObj,
  cache,
  instanceID,
  refetchRef,
  retry: queryRetry,
  retryDelay: queryRetryDelay,
  cacheTime: queryCacheTime
}) {
  const [
    providerState,
    setProviderState,
    providerMetaRef,
    configRef
  ] = React.useContext(context);

  // Use this cacheBusterRef ID to avoid cache usage
  const cacheBusterRef = React.useRef();
  if (!cacheBusterRef) {
    cacheBusterRef.current = uid++;
  }

  // Create the final query hash
  const [queryHash, queryID, variablesHash] = getQueryInfo({
    query,
    variables: variablesObj,
    cacheBuster: !cache ? cacheBusterRef.current : ""
  });

  const variables = useVariables(variablesObj);

  const defaultQueryState = React.useMemo(
    () => ({
      data: null,
      error: null,
      isFetching: false,
      fetchCount: 0,
      successCount: 0,
      failureCount: 0
    }),
    []
  );

  const queryState = providerState[queryHash] || defaultQueryState;

  const setQueryState = React.useCallback(
    updater => {
      return setProviderState(old => {
        const newValue =
          typeof updater === "function"
            ? updater(old[queryHash] || defaultQueryState)
            : updater;

        if (typeof newValue === "undefined") {
          const copy = { ...old };
          delete copy[queryHash];
          return copy;
        }

        return {
          ...old,
          [queryHash]: newValue
        };
      });
    },
    [setProviderState, queryHash, defaultQueryState]
  );

  providerMetaRef.current[queryHash] = providerMetaRef.current[queryHash] || {
    queryID,
    variablesHash,
    promise: null,
    previousDelay: 0,
    instancesByID: {}
  };

  providerMetaRef.current[queryHash].instancesByID[instanceID] = {
    refetchRef
  };

  if (providerMetaRef.current[queryHash].cleanupTimeout) {
    clearTimeout(providerMetaRef.current[queryHash].cleanupTimeout)
  }

  const metaRef = React.useRef();
  metaRef.current = providerMetaRef.current[queryHash];

  const queryConfigRef = React.useRef();
  queryConfigRef.current = {
    ...configRef.current,
    retry:
      typeof queryRetry !== "undefined" ? queryRetry : configRef.current.retry,
    retryDelay:
      typeof queryRetryDelay !== "undefined"
        ? queryRetryDelay
        : configRef.current.retryDelay,
    cacheTime: typeof queryCacheTime !== 'undefined' ? queryCacheTime : configRef.current.cacheTime
  };

  // Manage query active-ness and garbage collection
  React.useEffect(() => {
    const providerMetaCopy = providerMetaRef.current;

    return () => {
      // Do some cleanup between hash changes
      delete providerMetaCopy[queryHash].instancesByID[instanceID];

      // If no more instances are tied to this query, GC it
      if (!Object.keys(providerMetaCopy[queryHash].instancesByID).length) {
        providerMetaCopy[queryHash].cleanupTimeout = setTimeout(() => {
          delete providerMetaCopy[queryHash];
          setQueryState(undefined);
        }, queryConfigRef.current.cacheTime)
      }
    };
  }, [instanceID, providerMetaRef, queryHash, setQueryState]);

  return {
    queryState,
    setQueryState,
    metaRef,
    variables,
    queryHash,
    configRef
  };
}

export function useQuery(query, {
  variables: userVariables,
  tags = [],
  manual = false,
  cache = true,
  cacheTime,
  retry: queryRetry,
  retryDelay: queryRetryDelay
}) {
  const instanceIDRef = React.useRef(uid++);
  const instanceID = instanceIDRef.current;
  const refetchRef = React.useRef();

  const {
    queryState: {
      data,
      error,
      fetchCount,
      isFetching,
      successCount,
      failureCount
    },
    setQueryState,
    metaRef,
    variables: defaultVariables,
    configRef
  } = useSharedQuery({
    query,
    tags,
    variables: userVariables,
    cache,
    instanceID,
    refetchRef,
    retry: queryRetry,
    retryDelay: queryRetryDelay,
    cacheTime
  });

  const isCached = successCount && !error;

  const [isLoading, setIsLoading] = React.useState(!cache || !isCached);

  const latestRef = React.useRef({});
  latestRef.current = {
    successCount,
    error,
    failureCount,
    isFetching
  };

  refetchRef.current = React.useCallback(
    async ({ variables = defaultVariables, merge } = {}) => {
      if (merge && typeof merge !== "function") {
        merge = configRef.current.defaultMerge;
      }
      const fetch = async () => {
        try {
          return await query(variables);
        } catch (error) {
          setQueryState(old => {
            return {
              ...old,
              error,
              failureCount: old.failureCount + 1
            };
          });

          if (
            configRef.current.retry === true ||
            latestRef.current.failureCount < configRef.current.retry
          ) {
            const delay =
              typeof configRef.current.retryDelay === "function"
                ? configRef.current.retryDelay(
                    latestRef.current.failureCount + 1
                  )
                : configRef.current.retryDelay;

            return new Promise(resolve =>
              setTimeout(() => {
                resolve(fetch());
              }, delay)
            );
          }

          throw error
        }
      };

      // Create a new promise for the query cache if necessary
      if (!metaRef.current.promise) {
        metaRef.current.promise = new Promise(async (resolve, reject) => {
          const fetchID = uid++;
          metaRef.current.fetchID = fetchID;
          const isLatest = () => metaRef.current.fetchID === fetchID;
          if (!latestRef.current.successCount || latestRef.current.error) {
            setIsLoading(true);
          }
          try {
            setQueryState(old => {
              return {
                ...old,
                error: null,
                isFetching: true,
                fetchCount: old.fetchCount + 1,
                failureCount: 0
              };
            });
            const data = await fetch();
            if (isLatest()) {
              setQueryState(old => {
                return {
                  ...old,
                  data: merge ? merge(old.data, data) : data,
                  successCount: old.successCount + 1
                };
              });
              resolve(data);
              return data;
            }
            return new Promise((resolve, reject) => {
              // Never resolve this promise
            });
          } catch (err) {
            console.error(err);
            if (isLatest()) {
              reject(err);
            }
          } finally {
            if (isLatest()) {
              delete metaRef.current.promise;
              setIsLoading(false);
              setQueryState(old => {
                return {
                  ...old,
                  isFetching: false
                };
              });
            }
          }
        });
      }

      return metaRef.current.promise;
    },
    [defaultVariables, metaRef, query, setQueryState, configRef]
  );

  const refetch = refetchRef.current;

  React.useEffect(() => {
    if (manual) {
      return;
    }
    refetch();
  }, [manual, refetch]);

  return {
    data,
    error,
    isLoading,
    isFetching,
    fetchCount,
    successCount,
    failureCount,
    refetch
  };
}

export function useInvalidate() {
  const [, , providerMetaRef] = React.useContext(context);

  return React.useCallback(
    invalidators => {
      invalidators = Array.isArray(invalidators)
        ? invalidators
        : [invalidators];
      invalidators.forEach(invalidator => {
        const { query, variables } =
          typeof invalidator === "function"
            ? { query: invalidator }
            : invalidator;

        const [, queryID, variablesHash] = getQueryInfo({
          query,
          variables
        });

        Object.entries(providerMetaRef.current).forEach(
          ([queryHash, query]) => {
            if (!query.queryID === queryID) {
              return;
            }
            if (variablesHash && query.variablesHash !== variablesHash) {
              return;
            }

            Object.entries(query.instancesByID).forEach(
              ([instanceID, meta]) => {
                meta.refetchRef.current();
              }
            );
          }
        );
      });
    },
    [providerMetaRef]
  );
}

export function useUpdateQuery() {
  const [, setState] = React.useContext(context);

  return React.useCallback(
    ({ query, variables }, data) => {
      const [queryHash] = getQueryInfo({
        query,
        variables: typeof variables === 'function' ? variables(data) : variables
      });

      setState(old => ({
        ...old,
        [queryHash]: {
          ...old[queryHash],
          data
        }
      }));
    },
    [setState]
  );
}

export function useMutation(mutation, {
  invalidate: defaultInvalidate,
  update: defaultUpdate
}) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const invalidate = useInvalidate();
  const updateQuery = useUpdateQuery();

  const mutate = React.useCallback(
    async (
      variables,
      {
        invalidate: userInvalidate = defaultInvalidate,
        update = defaultUpdate
      } = {}
    ) => {
      setIsLoading(true);
      try {
        const res = await mutation(variables);
        setData(res);
        invalidate(userInvalidate);
        if (update) {
          updateQuery(update, res);
        }
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [defaultInvalidate, defaultUpdate, invalidate, mutation, updateQuery]
  );

  return [mutate, { data, isLoading, error }];
}

export function useIsFetching () {
  const [state] = React.useContext(context);
  return React.useMemo(() => {
    return Object.entries(state).some(([key, queryState]) => queryState.isFetching);
  }, [state])
}

export function useRefetchAll() {
  const [, , metaRef] = React.useContext(context);
  return React.useCallback(() => {
    Object.entries(metaRef.current).forEach(([key, query]) => {
      Object.entries(query.instancesByID).forEach(([key, instance]) => {
        instance.refetchRef.current();
      });
    });
  }, [metaRef]);
}
