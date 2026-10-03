'use client'

import { environmentManager } from '@tanstack/react-query'
import { useServerInsertedHTML } from 'next/navigation'
import * as React from 'react'
import { htmlEscapeJsonString } from './htmlescape'

const serializedSymbol = Symbol('serialized')

interface DataTransformer {
  serialize: (object: any) => any
  deserialize: (object: any) => any
}

type Serialized<TData> = unknown & {
  [serializedSymbol]: TData
}

interface TypedDataTransformer<TData> {
  serialize: (obj: TData) => Serialized<TData>
  deserialize: (obj: Serialized<TData>) => TData
}

interface HydrationStreamContext<TShape> {
  id: string
  stream: {
    /**
     * **Server method**
     * Push a new entry to the stream
     * Will be ignored on the client
     */
    push: (...shape: Array<TShape>) => void
  }
}

export interface HydrationStreamProviderProps<TShape> {
  children: React.ReactNode
  /**
   * Optional transformer to serialize/deserialize the data
   * Example devalue, superjson et al
   */
  transformer?: DataTransformer
  /**
   * **Client method**
   * Called in the browser when new entries are received
   */
  onEntries: (entries: Array<TShape>) => void
  /**
   * **Server method**
   * onFlush is called on the server when the cache is flushed
   */
  onFlush?: () => Array<TShape>
  /**
   * A nonce that'll allow the inline script to be executed when Content Security Policy is enforced
   */
  nonce?: string
}

/**
 * Creates a provider that streams entries (e.g. dehydrated query state) from the server to the
 * client while the page streams in, and the context it shares the stream through.
 * @returns The `Provider` component and its `context`.
 */
export function createHydrationStreamProvider<TShape>() {
  const StreamContext = React.createContext<HydrationStreamContext<TShape>>(
    null as any,
  )
  /**
   * 1. (Happens on server): the callback registered with `useServerInsertedHTML()` is called **on the server** whenever
   *    Next.js inserts HTML into the streamed response.
   *    - This means that we might have some new entries in the cache that needs to be flushed.
   *    - We pass these to the client by inserting a `<script>`-tag where we do `window[id].push(serializedVersionOfCache)`.
   * 2. (Happens in browser) In `useEffect()`:
   *   - We check if `window[id]` is set to an array and call `push()` on all the entries which will call `onEntries()` with the new entries.
   *   - We replace `window[id]` with a `push()`-method that will be called whenever new entries are received.
   * @param props - The `children` to render, the `onEntries`/`onFlush` callbacks, and the optional
   * `transformer` and `nonce`.
   * @returns The `children`, wrapped in the stream context provider.
   */
  function UseClientHydrationStreamProvider(props: {
    children: React.ReactNode
    /**
     * Optional transformer to serialize/deserialize the data
     * Example devalue, superjson et al
     */
    transformer?: DataTransformer
    /**
     * **Client method**
     * Called in the browser when new entries are received
     */
    onEntries: (entries: Array<TShape>) => void
    /**
     * **Server method**
     * onFlush is called on the server when the cache is flushed
     */
    onFlush?: () => Array<TShape>
    /**
     * A nonce that'll allow the inline script to be executed when Content Security Policy is enforced
     */
    nonce?: string
  }) {
    // unique id for the cache provider
    const id = `__RQ${React.useId()}`
    const idJSON = htmlEscapeJsonString(JSON.stringify(id))

    const [transformer] = React.useState(
      () =>
        (props.transformer ?? {
          // noop
          serialize: (obj: any) => obj,
          deserialize: (obj: any) => obj,
        }) as unknown as TypedDataTransformer<TShape>,
    )

    // <server stuff>
    const [stream] = React.useState<Array<TShape>>(() => {
      if (!environmentManager.isServer()) {
        return {
          push() {
            // no-op on the client
          },
        } as unknown as Array<TShape>
      }
      return []
    })
    const countRef = React.useRef(0)
    useServerInsertedHTML(() => {
      // This only happens on the server
      stream.push(...(props.onFlush?.() ?? []))

      if (!stream.length) {
        return null
      }
      // console.log(`pushing ${stream.length} entries`)
      const serializedCacheArgs = stream
        .map((entry) => transformer.serialize(entry))
        .map((entry) => JSON.stringify(entry))
        .join(',')

      // Flush stream
      stream.length = 0

      const html: Array<string> = [
        `window[${idJSON}] = window[${idJSON}] || [];`,
        `window[${idJSON}].push(${htmlEscapeJsonString(serializedCacheArgs)});`,
      ]
      return (
        <script
          key={countRef.current++}
          nonce={props.nonce}
          dangerouslySetInnerHTML={{
            __html: html.join(''),
          }}
        />
      )
    })
    // </server stuff>

    // <client stuff>
    // Setup and run the onEntries handler on the client only, but do it during
    // the initial render so children have access to the data immediately
    // This is important to avoid the client suspending during the initial render
    // if the data has not yet been hydrated.
    if (!environmentManager.isServer()) {
      const win = window as any
      if (!win[id]?.initialized) {
        // Client: consume cache:
        const onEntries = (...serializedEntries: Array<Serialized<TShape>>) => {
          const entries = serializedEntries.map((serialized) =>
            transformer.deserialize(serialized),
          )
          props.onEntries(entries)
        }

        const winStream: Array<Serialized<TShape>> = win[id] ?? []

        onEntries(...winStream)

        win[id] = {
          initialized: true,
          push: onEntries,
        }
      }
    }
    // </client stuff>

    return (
      <StreamContext.Provider value={{ stream, id }}>
        {props.children}
      </StreamContext.Provider>
    )
  }

  return {
    Provider: UseClientHydrationStreamProvider,
    context: StreamContext,
  }
}
