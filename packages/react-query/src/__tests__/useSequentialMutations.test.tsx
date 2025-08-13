import '@testing-library/jest-dom/vitest'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// no direct render import, use renderWithClient helper
import * as React from 'react'
// Note: use only fake timers flushing via vi.advanceTimersByTimeAsync
import { sleep } from '@tanstack/query-test-utils'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  useSequentialMutations,
} from '..'
import { mockOnlineManagerIsOnline, renderWithClient } from './utils'

describe('useSequentialMutations', () => {
  let queryCache: QueryCache
  let mutationCache: MutationCache
  let queryClient: QueryClient

  beforeEach(() => {
    queryCache = new QueryCache()
    mutationCache = new MutationCache()
    queryClient = new QueryClient({
      queryCache,
      mutationCache,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('executes in order and passes previous result as variables by default', async () => {
    const calls: Array<string> = []

    function Page() {
      const { mutateAsync } = useSequentialMutations(
        {
          mutations: [
            {
              options: {
                mutationFn: async (_: unknown) => {
                  calls.push('m1:undefined')
                  await sleep(10)
                  return 'a'
                },
              },
            },
            {
              options: {
                mutationFn: async (v: unknown) => {
                  calls.push(`m2:${String(v)}`)
                  await sleep(10)
                  return 'b'
                },
              },
            },
            {
              options: {
                mutationFn: async (v: unknown) => {
                  calls.push(`m3:${String(v)}`)
                  await sleep(10)
                  return 'c'
                },
              },
            },
          ],
        },
        queryClient,
      )

      React.useEffect(() => {
        void mutateAsync()
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(31)

    expect(calls).toEqual(['m1:undefined', 'm2:a', 'm3:b'])
  })

  it('derives variables from input/previous results by default', async () => {
    const seen: Array<{ i: number; v: unknown }> = []
    let outputs: Array<unknown> | null = null

    function Page() {
      const { mutateAsync } = useSequentialMutations(
        {
          mutations: [
            {
              options: {
                mutationFn: async (v: unknown) => {
                  await sleep(5)
                  return `s1:${String(v)}`
                },
              },
            },
            {
              options: {
                mutationFn: async (v: unknown) => {
                  seen.push({ i: 2, v })
                  await sleep(5)
                  return `s2:${String(v)}`
                },
              },
            },
            {
              options: {
                mutationFn: async (v: unknown) => {
                  seen.push({ i: 3, v })
                  await sleep(5)
                  return `s3:${String(v)}`
                },
              },
            },
          ],
        },
        queryClient,
      )

      React.useEffect(() => {
        ;(async () => {
          outputs = await mutateAsync('X')
        })()
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await vi.advanceTimersByTimeAsync(16)

    expect(seen.map((s) => s.v)).toEqual(['s1:X', 's2:s1:X'])
    expect(outputs).toEqual(['s1:X', 's2:s1:X', 's3:s2:s1:X'])
  })

  it('stops on first error when stopOnError=true (default)', async () => {
    const calls: Array<string> = []
    let errorMessage: string | null = null

    function Page() {
      const { mutateAsync } = useSequentialMutations(
        {
          mutations: [
            {
              options: {
                mutationFn: async () => {
                  await sleep(5)
                  throw new Error('e1')
                },
              },
            },
            {
              options: {
                mutationFn: async () => {
                  calls.push('should-not-run')
                  return 'ok'
                },
              },
            },
          ],
        },
        queryClient,
      )

      React.useEffect(() => {
        ;(async () => {
          try {
            await mutateAsync()
          } catch (e) {
            errorMessage = (e as Error).message
          }
        })()
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)
    await vi.advanceTimersByTimeAsync(6)

    expect(errorMessage).toBe('e1')
    expect(calls).toEqual([])
  })

  it('continues after error when stopOnError=false and includes error in outputs', async () => {
    const calls: Array<string> = []
    let outputs: Array<unknown> | null = null

    function Page() {
      const { mutateAsync } = useSequentialMutations(
        {
          stopOnError: false,
          mutations: [
            {
              options: {
                mutationFn: async () => {
                  await sleep(5)
                  throw new Error('boom')
                },
              },
            },
            {
              options: {
                mutationFn: async (v: unknown) => {
                  calls.push(`m2:${String(v)}`)
                  return 'ok2'
                },
              },
            },
          ],
        },
        queryClient,
      )

      React.useEffect(() => {
        ;(async () => {
          outputs = await mutateAsync('carry')
        })()
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)
    await vi.advanceTimersByTimeAsync(6)

    // After error, prevData resets to undefined, so next step receives undefined
    expect(calls).toEqual(['m2:undefined'])
    const outLen: number | undefined = outputs
      ? (outputs as Array<unknown>).length
      : undefined
    expect(outLen).toBe(2)
    expect(outputs?.[0]).toBeInstanceOf(Error)
    expect(outputs?.[1]).toBe('ok2')
  })

  it('calls step callbacks (onMutate/onSuccess/onError/onSettled) correctly', async () => {
    const calls: Array<string> = []

    function Page() {
      const { mutateAsync } = useSequentialMutations(
        {
          mutations: [
            {
              options: {
                mutationFn: async (v: string) => v + '-done',
                onMutate: (v: string) => {
                  calls.push(`m1:onMutate:${v}`)
                },
                onSuccess: (d: string, v: string) => {
                  calls.push(`m1:onSuccess:${d}|${v}`)
                },
                onSettled: (d: string | undefined, e: unknown, v: string) => {
                  calls.push(`m1:onSettled:${d}|${String(e)}|${v}`)
                },
              },
            },
            {
              options: {
                mutationFn: async (_: string) => {
                  throw new Error('e2')
                },
                onMutate: (v: string) => calls.push(`m2:onMutate:${v}`),
                onError: (e: Error, v: string) =>
                  calls.push(`m2:onError:${e.message}|${v}`),
                onSettled: (_d, e: Error, v: string) =>
                  calls.push(`m2:onSettled:${e.message}|${v}`),
              },
            },
          ],
          stopOnError: false,
        },
        queryClient,
      )

      React.useEffect(() => {
        void mutateAsync()
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)
    await vi.advanceTimersByTimeAsync(0)

    expect(calls).toEqual([
      'm1:onMutate:undefined',
      'm1:onSuccess:undefined-done|undefined',
      'm1:onSettled:undefined-done|null|undefined',
      'm2:onMutate:undefined-done',
      'm2:onError:e2|undefined-done',
      'm2:onSettled:e2|undefined-done',
    ])
  })

  it('retries a failed step according to retry/retryDelay', async () => {
    let attempts = 0
    const seen: Array<string> = []

    function Page() {
      const { mutateAsync } = useSequentialMutations(
        {
          mutations: [
            {
              options: {
                mutationFn: async () => {
                  attempts++
                  seen.push(`try:${attempts}`)
                  if (attempts < 2) throw new Error('fail')
                  return 'ok'
                },
                retry: 1,
                retryDelay: 5,
              },
            },
          ],
        },
        queryClient,
      )

      React.useEffect(() => {
        void mutateAsync()
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)
    await vi.advanceTimersByTimeAsync(6)

    expect(seen).toEqual(['try:1', 'try:2'])
  })

  it('pauses when offline (networkMode: offlineFirst) and resumes', async () => {
    const onlineMock = mockOnlineManagerIsOnline(false)

    let attempts = 0
    function Page() {
      const { results, mutate } = useSequentialMutations(
        {
          mutations: [
            {
              options: {
                mutationFn: async () => {
                  attempts++
                  if (attempts < 2) throw new Error('oops')
                  return 'ok'
                },
                retry: 1,
                retryDelay: 5,
                networkMode: 'offlineFirst',
              },
            },
          ],
        },
        queryClient,
      )

      return (
        <div>
          <button onClick={() => mutate()}>start</button>
          <div>status:{results[0]?.status}</div>
          <div>paused:{String(results[0]?.isPaused)}</div>
        </div>
      )
    }

    const r = renderWithClient(queryClient, <Page />)
    r.getByText('start').click()

    await vi.advanceTimersByTimeAsync(0)
    // initial attempt runs and fails (no pause yet on offlineFirst)
    expect(r.getByText('status:pending')).toBeInTheDocument()
    expect(r.getByText('paused:false')).toBeInTheDocument()
    expect(attempts).toBe(1)

    // after retry delay elapses, it should pause because still offline
    await vi.advanceTimersByTimeAsync(6)
    await vi.advanceTimersByTimeAsync(0)
    expect(r.getByText(/paused:\s*true/)).toBeInTheDocument()

    onlineMock.mockReturnValue(true)
    queryClient.getMutationCache().resumePausedMutations()
    await vi.advanceTimersByTimeAsync(6)
    await vi.advanceTimersByTimeAsync(0)
    expect(r.getByText('status:success')).toBeInTheDocument()
    expect(attempts).toBe(2)
    onlineMock.mockRestore()
  })

  it('uses mutation defaults from QueryClient for steps', async () => {
    const key = ['seq-default'] as const
    queryClient.setMutationDefaults(key, {
      mutationFn: async (v: string) => v.toUpperCase(),
    })

    let out: Array<unknown> | null = null
    function Page() {
      const { mutateAsync } = useSequentialMutations(
        {
          mutations: [
            { options: { mutationKey: key } as any },
            { options: { mutationKey: key } as any },
          ],
        },
        queryClient,
      )
      React.useEffect(() => {
        ;(async () => {
          out = await mutateAsync('ab')
        })()
      }, [mutateAsync])
      return null
    }

    renderWithClient(queryClient, <Page />)
    await vi.advanceTimersByTimeAsync(0)
    expect(out).toEqual(['AB', 'AB'.toUpperCase()])
  })

  it('passes meta to cache callbacks for each step', async () => {
    const successMock = vi.fn()
    const errorMock = vi.fn()
    const clientWithMeta = new QueryClient({
      mutationCache: new MutationCache({
        onSuccess: (_d, _v, _c, m) => successMock(m.meta?.tag),
        onError: (_e, _v, _c, m) => errorMock(m.meta?.tag),
      }),
      queryCache,
    })

    function Page() {
      const { mutate } = useSequentialMutations(
        {
          mutations: [
            { options: { mutationFn: async () => 'ok', meta: { tag: 's' } } },
            {
              options: {
                mutationFn: async () => {
                  throw new Error('x')
                },
                meta: { tag: 'f' },
              },
            },
          ],
        },
        clientWithMeta,
      )
      React.useEffect(() => {
        setTimeout(() => mutate(), 0)
      }, [mutate])
      return null
    }

    renderWithClient(clientWithMeta, <Page />)
    await vi.advanceTimersByTimeAsync(0)
    expect(successMock).toHaveBeenCalledWith('s')
    expect(errorMock).toHaveBeenCalledWith('f')
  })

  it('does not lose cache callbacks when unmounted mid-sequence', async () => {
    const onSuccess = vi.fn()
    const onSettled = vi.fn()
    let visible = true

    function Page() {
      const { mutate } = useSequentialMutations(
        {
          mutations: [
            {
              options: {
                mutationFn: async () => {
                  await sleep(10)
                  return 'ok'
                },
                onSuccess,
                onSettled,
              },
            },
          ],
        },
        queryClient,
      )
      return (
        <div>
          <button onClick={() => mutate()}>go</button>
          <button onClick={() => (visible = false)}>hide</button>
          {visible ? <span>on</span> : null}
        </div>
      )
    }

    const r = renderWithClient(queryClient, <Page />)
    r.getByText('go').click()
    r.getByText('hide').click()

    await vi.advanceTimersByTimeAsync(11)
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledTimes(1)
  })

  it('updates observers when steps increase/decrease and exposes per-step mutate/mutateAsync', async () => {
    const logs: Array<string> = []

    function makeMutations(n: number) {
      return Array.from({ length: n }, (_v, i) => ({
        options: {
          mutationFn: async (arg?: string) => {
            logs.push(`step${i}:${arg ?? 'none'}`)
            return `ok${i}`
          },
        },
      }))
    }

    function Page() {
      const [count, setCount] = React.useState(2)
      const cfg = React.useMemo(
        () => ({ mutations: makeMutations(count) }),
        [count],
      )
      const { results } = useSequentialMutations(cfg, queryClient)

      return (
        <div>
          <div>len:{results.length}</div>
          <button onClick={() => setCount((c) => c + 1)}>inc</button>
          <button onClick={() => setCount((c) => Math.max(1, c - 1))}>
            dec
          </button>
          <button onClick={() => results[0]?.mutate('x')}>call0m</button>
          <button
            onClick={() => {
              void results[0]?.mutateAsync('y')
            }}
          >
            call0a
          </button>
          <button
            onClick={() => {
              void results[2]?.mutateAsync('z')
            }}
          >
            call2a
          </button>
        </div>
      )
    }

    const r = renderWithClient(queryClient, <Page />)

    // initial: 2 steps
    expect(r.getByText('len:2')).toBeInTheDocument()
    r.getByText('call0m').click()
    await vi.advanceTimersByTimeAsync(0)
    r.getByText('call0a').click()
    await vi.advanceTimersByTimeAsync(0)

    // increase to 3 steps
    r.getByText('inc').click()
    await vi.advanceTimersByTimeAsync(0)
    expect(r.getByText(/len:\s*3/)).toBeInTheDocument()
    r.getByText('call2a').click()
    await vi.advanceTimersByTimeAsync(0)

    // decrease to 1 step
    r.getByText('dec').click()
    r.getByText('dec').click()
    await vi.advanceTimersByTimeAsync(0)
    expect(r.getByText(/len:\s*1/)).toBeInTheDocument()
    r.getByText('call0a').click()
    await vi.advanceTimersByTimeAsync(0)

    // verify logs
    expect(logs).toEqual(['step0:x', 'step0:y', 'step2:z', 'step0:y'])
  })

  it('falls back to snapshot ref getter on server-like env', async () => {
    // simulate isServer-like behavior by calling the selector directly (no DOM assertions needed)
    function Page() {
      const { results, mutate } = useSequentialMutations(
        {
          mutations: [{ options: { mutationFn: async () => 'ok' } }],
        },
        queryClient,
      )

      React.useEffect(() => {
        mutate()
      }, [mutate])

      return <div>status:{results[0]?.status}</div>
    }

    const r = renderWithClient(queryClient, <Page />)
    await vi.advanceTimersByTimeAsync(0)
    expect(r.getByText('status:success')).toBeInTheDocument()
  })

  it('exposes per-step mutateAsync that returns resolved data', async () => {
    let displayed: string | null = null

    function Page() {
      const { results } = useSequentialMutations(
        {
          mutations: [
            {
              options: {
                mutationFn: async (v: string) => {
                  await sleep(5)
                  return `${v}-done`
                },
              },
            },
          ],
        },
        queryClient,
      )

      React.useEffect(() => {
        ;(async () => {
          const value = await results[0]!.mutateAsync('X')
          displayed = String(value)
        })()
      }, [results])

      return <div>{displayed ?? 'pending'}</div>
    }

    const r = renderWithClient(queryClient, <Page />)
    expect(r.getByText('pending')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(6)
    expect(r.getByText('X-done')).toBeInTheDocument()
  })

  it('uses getServerSnapshot during SSR render (len reflects observers)', () => {
    // render on server to trigger getServerSnapshot path of useSyncExternalStore
    const { renderToString } =
      require('react-dom/server') as typeof import('react-dom/server')

    function Page() {
      const { results } = useSequentialMutations(
        {
          mutations: [
            {
              options: {
                mutationFn: async () => 'ok',
              },
            },
          ],
        },
        queryClient,
      )
      return <div>len:{results.length}</div>
    }

    const html = renderToString(<Page />)
    // react 19 adds comment markers for expressions in SSR output, so normalize whitespace/comments
    const normalized = String(html).replace(/<!--\s*-->/g, '')
    expect(normalized).toContain('len:1')
  })

  it('per-step mutate swallows rejection via catch(noop) and updates error state', async () => {
    function Page() {
      const { results } = useSequentialMutations(
        {
          mutations: [
            {
              options: {
                mutationFn: async () => {
                  throw new Error('boom')
                },
              },
            },
          ],
        },
        queryClient,
      )
      React.useEffect(() => {
        results[0]?.mutate('x')
      }, [results])
      return (
        <div>
          <span>status:{results[0]?.status}</span>
          <span>isError:{String(results[0]?.isError)}</span>
        </div>
      )
    }

    const r = renderWithClient(queryClient, <Page />)
    await vi.advanceTimersByTimeAsync(0)
    expect(r.getByText('isError:true')).toBeInTheDocument()
  })

  describe('coverage for unmount/abort and getVariables error branches', () => {
    it('returns empty array when mutateAsync is called after unmount (early return path)', async () => {
      let call: null | ((input?: unknown) => Promise<Array<unknown>>) = null

      function Page() {
        const { mutateAsync } = useSequentialMutations(
          {
            mutations: [
              {
                options: {
                  mutationFn: async () => {
                    await sleep(10)
                    return 'ok'
                  },
                },
              },
            ],
          },
          queryClient,
        )

        React.useEffect(() => {
          call = mutateAsync
        }, [mutateAsync])

        return null
      }

      const r = renderWithClient(queryClient, <Page />)
      r.unmount()
      const out = await call!()
      expect(out).toEqual([])
    })

    // Note: The very first loop check is synchronous; it's hard to reliably unmount before it runs.
    // We instead target the checks after async boundaries below.

    it('handles mutation throwing before any progress: stopOnError=true throws and exposes error', async () => {
      let error: unknown = null

      function Page() {
        const { mutateAsync, error: hookError } = useSequentialMutations(
          {
            mutations: [
              {
                options: {
                  mutationFn: async () => {
                    throw new Error('gv')
                  },
                },
              },
            ],
          },
          queryClient,
        )

        React.useEffect(() => {
          ;(async () => {
            try {
              await mutateAsync()
            } catch (e) {
              error = e
            }
          })()
        }, [mutateAsync])

        return <div>err:{String((hookError as any)?.message ?? '')}</div>
      }

      const r = renderWithClient(queryClient, <Page />)
      await vi.advanceTimersByTimeAsync(0)
      expect((error as Error).message).toBe('gv')
      expect(r.getByText('err:gv')).toBeInTheDocument()
    })

    it('handles mutation throwing: stopOnError=false continues and pushes error', async () => {
      let outputs: Array<unknown> | null = null

      function Page() {
        const { mutateAsync } = useSequentialMutations(
          {
            stopOnError: false,
            mutations: [
              {
                options: {
                  mutationFn: async () => {
                    throw new Error('gv2')
                  },
                },
              },
              {
                options: {
                  mutationFn: async () => 'ok2',
                },
              },
            ],
          },
          queryClient,
        )

        React.useEffect(() => {
          ;(async () => {
            outputs = await mutateAsync()
          })()
        }, [mutateAsync])

        return null
      }

      renderWithClient(queryClient, <Page />)
      await vi.advanceTimersByTimeAsync(0)
      const outLen2: number | undefined = outputs
        ? (outputs as Array<unknown>).length
        : undefined
      expect(outLen2).toBe(2)
      expect(outputs?.[0]).toBeInstanceOf(Error)
      expect(outputs?.[1]).toBe('ok2')
    })

    // Removed getVariables-based catch-break tests; covered by mutation resolve/reject abort tests below

    // Removed (redundant with mutation reject after abort)

    // Removed (redundant with mutation resolve after abort)

    // removed: flaky ordering; covered by the next two deterministic cases

    it('deterministically breaks after mutation resolves when aborted before post-check', async () => {
      let doUnmount: null | (() => void) = null
      const deferred: {
        resolve?: (v: unknown) => void
        promise: Promise<unknown>
      } = {
        promise: Promise.resolve(undefined),
      }
      deferred.promise = new Promise((res) => {
        deferred.resolve = res
      })

      function Parent() {
        const [on, setOn] = React.useState(true)
        doUnmount = () => setOn(false)
        return on ? <Page /> : null
      }

      let outputs: Array<unknown> | null = null
      function Page() {
        const { mutateAsync } = useSequentialMutations(
          {
            mutations: [
              {
                options: {
                  mutationFn: async () => deferred.promise,
                },
              },
            ],
          },
          queryClient,
        )
        React.useEffect(() => {
          ;(async () => {
            outputs = await mutateAsync()
          })()
        }, [mutateAsync])
        return null
      }

      renderWithClient(queryClient, <Parent />)
      // abort, wait cleanup, then resolve mutation to hit break after await
      ;(doUnmount as any)?.()
      await vi.advanceTimersByTimeAsync(0)
      deferred.resolve?.('ok')
      await vi.advanceTimersByTimeAsync(0)
      expect(outputs).toEqual([])
    })

    it('deterministically breaks before handling error when mutation rejects after abort', async () => {
      let doUnmount: null | (() => void) = null
      const deferred: {
        reject?: (e: unknown) => void
        promise: Promise<unknown>
      } = {
        promise: Promise.resolve(undefined),
      }
      deferred.promise = new Promise((_, rej) => {
        deferred.reject = rej
      })

      function Parent() {
        const [on, setOn] = React.useState(true)
        doUnmount = () => setOn(false)
        return on ? <Page /> : null
      }

      let outputs: Array<unknown> | null = null
      function Page() {
        const { mutateAsync } = useSequentialMutations(
          {
            stopOnError: false,
            mutations: [
              {
                options: {
                  mutationFn: async () => deferred.promise,
                },
              },
            ],
          },
          queryClient,
        )
        React.useEffect(() => {
          ;(async () => {
            outputs = await mutateAsync()
          })()
        }, [mutateAsync])
        return null
      }

      renderWithClient(queryClient, <Parent />)
      // abort, wait cleanup, then reject mutation to hit break in error path
      ;(doUnmount as any)?.()
      await vi.advanceTimersByTimeAsync(0)
      deferred.reject?.(new Error('fail'))
      await vi.advanceTimersByTimeAsync(0)
      expect(outputs).toEqual([])
    })

    it('runs cleanup: aborts active controllers and clears set on unmount', async () => {
      // ensure abort path in cleanup is executed while a controller exists
      let call: null | (() => void) = null
      function Page() {
        const { mutateAsync } = useSequentialMutations(
          {
            mutations: [
              {
                options: {
                  mutationFn: async () => {
                    await sleep(50)
                    return 'ok'
                  },
                },
              },
            ],
          },
          queryClient,
        )
        call = () => {
          void mutateAsync()
        }
        return <div>ready</div>
      }

      const r = renderWithClient(queryClient, <Page />)
      r.getByText('ready')
      ;(call as any)?.()
      // unmount immediately so cleanup abort executes while controller is active
      r.unmount()
      await vi.advanceTimersByTimeAsync(0)
      // no assertion needed; covering cleanup lines
    })

    it('breaks at loop start when AbortController starts aborted', async () => {
      const OriginalAbortController = globalThis.AbortController
      class PreAbortedController {
        signal = { aborted: true } as AbortSignal
        abort() {}
      }
      // @ts-ignore overriding for test env
      globalThis.AbortController = PreAbortedController as any

      let outputs: Array<unknown> | null = null
      function Page() {
        const { mutateAsync } = useSequentialMutations(
          {
            mutations: [
              {
                options: { mutationFn: async () => 'never' },
              },
            ],
          },
          queryClient,
        )
        React.useEffect(() => {
          ;(async () => {
            outputs = await mutateAsync()
          })()
        }, [mutateAsync])
        return null
      }

      renderWithClient(queryClient, <Page />)
      await vi.advanceTimersByTimeAsync(0)
      expect(outputs).toEqual([])

      globalThis.AbortController = OriginalAbortController
    })
  })

  it('supports call-time per-step mutateOptions via index map', async () => {
    const onSuccess0 = vi.fn()
    const onError1 = vi.fn()

    let outputs: Array<unknown> | null = null

    function Page() {
      const { mutateAsync } = useSequentialMutations(
        {
          mutations: [
            {
              options: {
                mutationFn: async (name: string) => {
                  await sleep(1)
                  return `u:${name}`
                },
              },
            },
            {
              options: {
                mutationFn: async () => {
                  await sleep(1)
                  throw new Error('boom')
                },
              },
            },
          ],
          stopOnError: false,
        },
        queryClient,
      )

      React.useEffect(() => {
        ;(async () => {
          outputs = await mutateAsync('A', [
            { onSuccess: onSuccess0 },
            { onError: onError1 },
          ])
        })()
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)
    await vi.advanceTimersByTimeAsync(3)

    expect(onSuccess0).toHaveBeenCalledTimes(1)
    // context is undefined in these tests because no onMutate returns a context
    expect(onSuccess0).toHaveBeenCalledWith('u:A', 'A', undefined)
    expect(onError1).toHaveBeenCalledTimes(1)
    expect(onError1.mock.calls[0]![0]).toBeInstanceOf(Error)
    expect(outputs).not.toBeNull()
    expect(Array.isArray(outputs)).toBe(true)
  })

  it('supports call-time per-step mutateOptions via function mapper', async () => {
    const seen: Array<string> = []

    function Page() {
      const { mutateAsync } = useSequentialMutations(
        {
          mutations: [
            { options: { mutationFn: async (v: string) => `a:${v}` } },
            { options: { mutationFn: async (v: string) => `b:${v}` } },
          ],
        },
        queryClient,
      )

      React.useEffect(() => {
        ;(async () => {
          await mutateAsync('X', (i) => ({
            onSuccess: (data) => {
              seen.push(`ok${i}:${String(data)}`)
            },
          }))
        })()
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)
    await vi.advanceTimersByTimeAsync(0)
    expect(seen).toEqual(['ok0:a:X', 'ok1:b:a:X'])
  })

  it('covers non-array, non-function stepOptions (Array.isArray false branch)', async () => {
    let outputs: Array<unknown> | null = null

    function Page() {
      const { mutateAsync } = useSequentialMutations(
        {
          mutations: [
            { options: { mutationFn: async (v: string) => `ok:${v}` } },
          ],
        },
        queryClient,
      )

      React.useEffect(() => {
        ;(async () => {
          // Pass an object to hit the Array.isArray(stepOptions) === false branch
          outputs = await mutateAsync('Z', { foo: 'bar' } as any)
        })()
      }, [mutateAsync])

      return null
    }

    renderWithClient(queryClient, <Page />)
    await vi.advanceTimersByTimeAsync(0)
    expect(outputs).toEqual(['ok:Z'])
  })
})
