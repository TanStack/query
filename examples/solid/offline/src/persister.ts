import { unwrap } from "solid-js/store"
import type { PersistedClient, Persister } from "@tanstack/solid-query-persist-client";
import { get, set, del } from "idb-keyval";

import _lodashModule from 'lodash-es';
import _deepdashModule from 'deepdash-es';
const lodash = _deepdashModule(_lodashModule);

/**
 * Creates an Indexed DB persister
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 * @see https://tanstack.com/query/v4/docs/plugins/persistQueryClient#building-a-persister
 */
export function createIndexedDBPersister(idbValidKey: IDBValidKey = "tanstack-query"): Persister {
  let _persistNum = 0
  return {
    // FIXME this is called too often
    // at least 3 times too often
    persistClient: async (client: PersistedClient) => {
      _persistNum++
      const persistNum = _persistNum
      // remove Proxy objects from solid-js
      // fix: DOMException: Failed to execute 'put' on 'IDBObjectStore': [object Array] could not be cloned.
      client = unwrap(client)
      // FIXME client contains a function: clientState.queries[0].state.data.movie.comment
      // workaround: comment -> comment()
      for (let i = 0; i < client.clientState.queries.length; i++) {
        const query = client.clientState.queries[i]
        //query.state.data = unwrap(query.state.data) // no effect
        if (typeof query.state.data?.movie?.comment == "function") {
          // FIXME this way, we lose reactivity
          query.state.data.movie.comment = query.state.data.movie.comment()
        }
      }
      // FIXME caching mutations: DOMException: Failed to execute 'put' on 'IDBObjectStore': function () { [native code] } could not be cloned.
      // fix: comment -> comment()
      // https://github.com/localForage/localForage/issues/610
      //console.log(`persister persistClient ${persistNum}: client`, client)
      //console.time('persister persistClient') // debug
      const t1 = Date.now()
      try {
        await set(idbValidKey, client);
      }
      catch (error: any) {
        // debug
        //console.dir({ message: error.message })
        //console.dir({ error }) // not helpful. does not have the error location
        // find error location
        const target = (
          error.message.match(/^Failed to execute 'put' on 'IDBObjectStore': (.*) could not be cloned\.$/) ||
          [null, null]
        )[1]
        if (target == 'function () { [native code] }') {
          console.error(`persister persistClient ${persistNum}: error: client contains a function:`, lodash.findPathDeep(client, (val) => typeof val == 'function'))
        }
        else {
          console.error(`persister persistClient ${persistNum}: error`, error)
        }
        //if (error.message == "Failed to execute 'put' on 'IDBObjectStore': function () { [native code] } could not be cloned.")
      }
      const t2 = Date.now()
      console.log(`persister persistClient ${persistNum}: done after ${t2 - t1}ms`)
      //console.timeEnd('persister persistClient') // debug
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
