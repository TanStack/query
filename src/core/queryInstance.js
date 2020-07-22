import { uid, isServer, isDocumentVisible, Console } from './utils'

export function makeQueryInstance(query, onStateUpdate) {
  const instance = {
    id: uid(),
    onStateUpdate,
  }

  instance.clearInterval = () => {
    clearInterval(instance.refetchIntervalId)
    delete instance.refetchIntervalId
  }

  instance.updateConfig = config => {
    const oldConfig = instance.config

    // Update the config
    instance.config = config

    if (!isServer) {
      if (oldConfig?.refetchInterval === config.refetchInterval) {
        return
      }

      query.clearIntervals()

      const minInterval = Math.min(
        ...query.instances.map(d => d.config.refetchInterval || Infinity)
      )

      if (
        !instance.refetchIntervalId &&
        minInterval > 0 &&
        minInterval < Infinity
      ) {
        instance.refetchIntervalId = setInterval(() => {
          if (
            query.instances.some(instance => instance.config.enabled) &&
            (isDocumentVisible() ||
              query.instances.some(
                instance => instance.config.refetchIntervalInBackground
              ))
          ) {
            query.fetch()
          }
        }, minInterval)
      }
    }
  }

  instance.run = async () => {
    try {

      // Don't refetch on mount when 'neverRefetchOnMount' is set, otherwise only refetch if either only one instance of the query exists or 'refetchOnMount' is set
      const shouldRefetchOnMount = query.config.neverRefetchOnMount ? false : (query.config.refetchOnMount || query.instances.length === 1);

      if(
        (!query.state.isSuccess || shouldRefetchOnMount) && // Make sure first load happens, thereafter only if refetch on mount is requested
        query.config.enabled && // Don't auto refetch if disabled
        !query.wasSuspended && // Don't double refetch for suspense
        query.state.isStale // Only refetch if stale
        
      ) {
        await query.fetch();
      }

      query.wasSuspended = false
    } catch (error) {
      Console.error(error)
    }
  }

  instance.unsubscribe = () => {
    query.instances = query.instances.filter(d => d.id !== instance.id)

    if (!query.instances.length) {
      instance.clearInterval()
      query.cancel()

      if (!isServer) {
        // Schedule garbage collection
        query.scheduleGarbageCollection()
      }
    }
  }

  return instance
}
