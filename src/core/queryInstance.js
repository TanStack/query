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
      // Perform the refetch for this query if necessary
      if (
        query.config.enabled && // Don't auto refetch if disabled
        !query.wasSuspended && // Don't double refetch for suspense
        query.state.isStale && // Only refetch if stale
        (query.config.refetchOnMount || query.instances.length === 1)
      ) {
        await query.fetch()
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
