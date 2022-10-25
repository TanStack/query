import { unwrap } from "solid-js/store"
import type { PersistedClient, Persister } from "@tanstack/solid-query-persist-client";
import { get, set, del } from "idb-keyval";

/**
 * Creates an Indexed DB persister
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 * @see https://tanstack.com/query/v4/docs/plugins/persistQueryClient#building-a-persister
 */
export function createIndexedDBPersister(idbValidKey: IDBValidKey = "tanstack-query"): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      // remove Proxy objects from solid-js
      // fix: DOMException: Failed to execute 'put' on 'IDBObjectStore': [object Array] could not be cloned.
      for (let i = 0; i < client.clientState.queries.length; i++) {
        const query = client.clientState.queries[i]
        query.queryKey = unwrap(query.queryKey)
      }
      set(idbValidKey, client);
    },

    restoreClient: async () => {
      console.time('persister restoreClient') // debug
      const client = await get(idbValidKey);
      console.timeEnd('persister restoreClient') // debug
      return client;
    },

    removeClient: async () => {
      await del(idbValidKey);
    },
  };
}
