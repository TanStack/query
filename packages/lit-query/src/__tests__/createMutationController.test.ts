import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, noop } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement, html } from 'lit'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { createMutationController } from '../createMutationController.js'
import { generateElementName } from './utils.js'
import type { MutationResultAccessor } from '../createMutationController.js'

const providerTagName = generateElementName()
customElements.define(providerTagName, QueryClientProvider)

describe('createMutationController', () => {
  let queryClient: QueryClient
  let container: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(() => {
    container.remove()
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should resolve from the pre-connect placeholder state on the first provider connection', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly mutationKey = key

      readonly mutation = createMutationController(this, {
        mutationKey: this.mutationKey,
        mutationFn: (value: number) => sleep(10).then(() => value + 1),
      })

      override render() {
        return html`status: ${this.mutation().status}`
      }
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    expect(consumer.mutation().isIdle).toBe(true)
    expect(() => consumer.mutation.mutate(1)).toThrow(
      /No QueryClient available/,
    )
    await expect(consumer.mutation.mutateAsync(1)).rejects.toThrow(
      /No QueryClient available/,
    )

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)

    container.append(provider)
    await provider.updateComplete
    await consumer.updateComplete
    expect(consumer.shadowRoot).toHaveTextContent('status: idle')

    const mutatePromise = consumer.mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(mutatePromise).resolves.toBe(2)
    expect(consumer.mutation().isSuccess).toBe(true)
    expect(consumer.shadowRoot).toHaveTextContent('status: success')

    consumer.mutation.destroy()
    provider.remove()
  })

  it('should prefer an explicit client over the provider context', async () => {
    const key = queryKey()
    const providerClient = new QueryClient()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = providerClient

    class Consumer extends LitElement {
      readonly mutationKey = key

      readonly mutation = createMutationController(
        this,
        {
          mutationKey: this.mutationKey,
          mutationFn: (value: number) => sleep(10).then(() => value + 1),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    provider.append(consumer)

    container.append(provider)
    await provider.updateComplete

    const mutatePromise = consumer.mutation.mutateAsync(2)
    await vi.advanceTimersByTimeAsync(10)
    await expect(mutatePromise).resolves.toBe(3)

    expect(
      queryClient
        .getMutationCache()
        .findAll({ mutationKey: consumer.mutationKey }).length,
    ).toBeGreaterThan(0)
    expect(
      providerClient
        .getMutationCache()
        .findAll({ mutationKey: consumer.mutationKey }).length,
    ).toBe(0)

    consumer.mutation.destroy()
    provider.remove()
  })

  it('should resolve mutateAsync with the mutation data', async () => {
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (value: number) => sleep(10).then(() => value + 1),
        },
        queryClient,
      )

      override render() {
        return html`data: ${this.mutation().data ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation
    await host.updateComplete
    expect(host.shadowRoot).toHaveTextContent('data: none')

    const resultPromise = mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(resultPromise).resolves.toBe(2)
    expect(mutation().isSuccess).toBe(true)
    expect(mutation().data).toBe(2)
    expect(host.shadowRoot).toHaveTextContent('data: 2')
  })

  it('should update the result when mutate succeeds', async () => {
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (value: number) => sleep(10).then(() => value + 1),
        },
        queryClient,
      )

      override render() {
        return html`data: ${this.mutation().data ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation
    await host.updateComplete

    mutation.mutate(2)
    await vi.advanceTimersByTimeAsync(10)
    expect(mutation().data).toBe(3)
    expect(mutation().isSuccess).toBe(true)
    expect(host.shadowRoot).toHaveTextContent('data: 3')
  })

  it('should be able to use mutation defaults', async () => {
    const key = queryKey()

    queryClient.setMutationDefaults(key, {
      mutationFn: (text: string) => sleep(10).then(() => text),
    })

    class Host extends LitElement {
      readonly mutation = createMutationController<string, unknown, string>(
        this,
        { mutationKey: key },
        queryClient,
      )

      override render() {
        const { status, data } = this.mutation()
        return html`status: ${status}, data: ${data ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()

    container.append(host)
    await host.updateComplete
    expect(host.shadowRoot).toHaveTextContent('status: idle, data: none')

    host.mutation.mutate('todo')
    await vi.advanceTimersByTimeAsync(0)
    expect(host.shadowRoot).toHaveTextContent('status: pending, data: none')
    await vi.advanceTimersByTimeAsync(10)
    expect(host.mutation().data).toBe('todo')
    expect(host.shadowRoot).toHaveTextContent('status: success, data: todo')
  })

  it('should transition from idle to pending to success', async () => {
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (value: number) =>
            sleep(10).then(() => {
              if (value < 0) {
                throw new Error('negative-not-allowed')
              }
              return value + 1
            }),
        },
        queryClient,
      )

      override render() {
        const { status, data } = this.mutation()
        return html`status: ${status}, data: ${data ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation
    await host.updateComplete

    expect(mutation().isIdle).toBe(true)
    expect(host.shadowRoot).toHaveTextContent('status: idle, data: none')

    const successPromise = mutation.mutateAsync(10)
    await vi.advanceTimersByTimeAsync(0)
    expect(mutation().isPending).toBe(true)
    expect(host.shadowRoot).toHaveTextContent('status: pending, data: none')
    await vi.advanceTimersByTimeAsync(10)
    await expect(successPromise).resolves.toBe(11)
    expect(mutation().isSuccess).toBe(true)
    expect(mutation().data).toBe(11)
    expect(host.shadowRoot).toHaveTextContent('status: success, data: 11')
  })

  it('should transition from pending to error when the mutation fails', async () => {
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (value: number) =>
            sleep(10).then(() => {
              if (value < 0) {
                throw new Error('negative-not-allowed')
              }
              return value + 1
            }),
        },
        queryClient,
      )

      override render() {
        const { status, error } = this.mutation()
        return html`status: ${status}, error: ${error?.message ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation

    const errorPromise = mutation
      .mutateAsync(-1)
      .catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(0)
    expect(mutation().isPending).toBe(true)
    expect(host.shadowRoot).toHaveTextContent('status: pending, error: none')
    await vi.advanceTimersByTimeAsync(10)
    expect(await errorPromise).toEqual(new Error('negative-not-allowed'))
    expect(mutation().isError).toBe(true)
    expect(mutation().error).toEqual(new Error('negative-not-allowed'))
    expect(host.shadowRoot).toHaveTextContent(
      'status: error, error: negative-not-allowed',
    )
  })

  it('should reset mutation state back to the idle baseline', async () => {
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: () =>
            sleep(10).then(() => Promise.reject(new Error('reset-target'))),
        },
        queryClient,
      )

      override render() {
        const { status, error } = this.mutation()
        return html`status: ${status}, error: ${error?.message ?? 'none'}`
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation

    await Promise.all([
      expect(mutation.mutateAsync(undefined)).rejects.toThrow('reset-target'),
      vi.advanceTimersByTimeAsync(10),
    ])
    expect(mutation().isError).toBe(true)
    expect(mutation().error).toEqual(new Error('reset-target'))
    expect(host.shadowRoot).toHaveTextContent(
      'status: error, error: reset-target',
    )

    mutation.reset()
    await vi.advanceTimersByTimeAsync(0)
    expect(mutation().isIdle).toBe(true)
    expect(mutation().isPaused).toBe(false)
    expect(mutation().isError).toBe(false)
    expect(mutation().error).toBeNull()
    expect(mutation().data).toBeUndefined()
    expect(host.shadowRoot).toHaveTextContent('status: idle, error: none')
  })

  it('should call mutate callbacks when createMutationController has no callbacks', async () => {
    const callbacks: Array<string> = []

    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (text: string) => sleep(10).then(() => text),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    host.mutation.mutate('todo', {
      onSuccess: () => {
        callbacks.push('mutate.onSuccess')
      },
      onSettled: () => {
        callbacks.push('mutate.onSettled')
      },
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(callbacks).toEqual(['mutate.onSuccess', 'mutate.onSettled'])
  })

  it('should call mutateAsync callbacks when createMutationController has no callbacks', async () => {
    const callbacks: Array<string> = []

    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (text: string) => sleep(10).then(() => text),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    host.mutation.mutateAsync('todo', {
      onSuccess: () => {
        callbacks.push('mutateAsync.onSuccess')
      },
      onSettled: () => {
        callbacks.push('mutateAsync.onSettled')
      },
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(callbacks).toEqual([
      'mutateAsync.onSuccess',
      'mutateAsync.onSettled',
    ])
  })

  it('should call mutate error callbacks when createMutationController has no callbacks', async () => {
    const callbacks: Array<string> = []

    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (_text: string) =>
            sleep(10).then(() => {
              throw new Error('oops')
            }),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    host.mutation.mutate('todo', {
      onError: () => {
        callbacks.push('mutate.onError')
      },
      onSettled: () => {
        callbacks.push('mutate.onSettled')
      },
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(callbacks).toEqual(['mutate.onError', 'mutate.onSettled'])
  })

  it('should call mutateAsync error callbacks when createMutationController has no callbacks', async () => {
    const callbacks: Array<string> = []

    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (_text: string) =>
            sleep(10).then(() => {
              throw new Error('oops')
            }),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    host.mutation
      .mutateAsync('todo', {
        onError: () => {
          callbacks.push('mutateAsync.onError')
        },
        onSettled: () => {
          callbacks.push('mutateAsync.onSettled')
        },
      })
      .catch(noop)
    await vi.advanceTimersByTimeAsync(10)
    expect(callbacks).toEqual(['mutateAsync.onError', 'mutateAsync.onSettled'])
  })

  it('should call only mutate onSuccess when createMutationController has no callbacks', async () => {
    const callbacks: Array<string> = []

    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (text: string) => sleep(10).then(() => text),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    host.mutation.mutate('todo', {
      onSuccess: () => {
        callbacks.push('mutate.onSuccess')
      },
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(callbacks).toEqual(['mutate.onSuccess'])
  })

  it('should call only mutate onError when createMutationController has no callbacks', async () => {
    const callbacks: Array<string> = []

    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (_text: string) =>
            sleep(10).then(() => {
              throw new Error('oops')
            }),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    host.mutation.mutate('todo', {
      onError: () => {
        callbacks.push('mutate.onError')
      },
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(callbacks).toEqual(['mutate.onError'])
  })

  it('should call only mutate onSettled when createMutationController has no callbacks', async () => {
    const callbacks: Array<string> = []

    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (text: string) => sleep(10).then(() => text),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    host.mutation.mutate('todo', {
      onSettled: () => {
        callbacks.push('mutate.onSettled')
      },
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(callbacks).toEqual(['mutate.onSettled'])
  })

  it('should call only mutateAsync onSuccess when createMutationController has no callbacks', async () => {
    const callbacks: Array<string> = []

    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (text: string) => sleep(10).then(() => text),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    host.mutation.mutateAsync('todo', {
      onSuccess: () => {
        callbacks.push('mutateAsync.onSuccess')
      },
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(callbacks).toEqual(['mutateAsync.onSuccess'])
  })

  it('should call only mutateAsync onError when createMutationController has no callbacks', async () => {
    const callbacks: Array<string> = []

    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (_text: string) =>
            sleep(10).then(() => {
              throw new Error('oops')
            }),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    host.mutation
      .mutateAsync('todo', {
        onError: () => {
          callbacks.push('mutateAsync.onError')
        },
      })
      .catch(noop)
    await vi.advanceTimersByTimeAsync(10)
    expect(callbacks).toEqual(['mutateAsync.onError'])
  })

  it('should call only mutateAsync onSettled when createMutationController has no callbacks', async () => {
    const callbacks: Array<string> = []

    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (text: string) => sleep(10).then(() => text),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)

    host.mutation.mutateAsync('todo', {
      onSettled: () => {
        callbacks.push('mutateAsync.onSettled')
      },
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(callbacks).toEqual(['mutateAsync.onSettled'])
  })

  it('should not throw from mutate while mutateAsync rejects on error', async () => {
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (value: number) =>
            sleep(10).then(() => {
              if (value < 0) {
                throw new Error('negative-not-allowed')
              }

              return value + 1
            }),
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation

    expect(() => mutation.mutate(-1)).not.toThrow()
    await vi.advanceTimersByTimeAsync(10)
    expect(mutation().isError).toBe(true)
    expect(mutation().error).toEqual(new Error('negative-not-allowed'))

    await Promise.all([
      expect(mutation.mutateAsync(-1)).rejects.toThrow('negative-not-allowed'),
      vi.advanceTimersByTimeAsync(10),
    ])
  })

  it('should call mutation callbacks in a deterministic order and count', async () => {
    const callbackEvents: Array<string> = []
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (value: number) =>
            sleep(10).then(() => {
              if (value < 0) {
                throw new Error('callback-order-failure')
              }
              return value + 1
            }),
          onSuccess: (_data, value) => {
            callbackEvents.push(`success:${value}`)
          },
          onError: (_error, value) => {
            callbackEvents.push(`error:${value}`)
          },
          onSettled: (_data, _error, value) => {
            callbackEvents.push(`settled:${value}`)
          },
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation

    const successPromise = mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(successPromise).resolves.toBe(2)

    await Promise.all([
      expect(mutation.mutateAsync(-1)).rejects.toThrow(
        'callback-order-failure',
      ),
      vi.advanceTimersByTimeAsync(10),
    ])
    expect(callbackEvents).toEqual([
      'success:1',
      'settled:1',
      'error:-1',
      'settled:-1',
    ])
  })

  it('should use the latest closures for refreshed mutation callbacks', async () => {
    const callbackEvents: Array<string> = []
    let version = 'v1'
    class Host extends LitElement {
      readonly mutation = createMutationController(
        this,
        () => {
          const callbackVersion = version

          return {
            mutationFn: (value: number) =>
              sleep(10).then(() => {
                if (value < 0) {
                  throw new Error('freshness-failure')
                }
                return value + 1
              }),
            onSuccess: () => {
              callbackEvents.push(`success:${callbackVersion}`)
            },
            onError: () => {
              callbackEvents.push(`error:${callbackVersion}`)
            },
            onSettled: () => {
              callbackEvents.push(`settled:${callbackVersion}`)
            },
          }
        },
        queryClient,
      )
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    const mutation = host.mutation

    const successPromise = mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(successPromise).resolves.toBe(2)
    expect(callbackEvents.slice(0, 2)).toEqual(['success:v1', 'settled:v1'])

    version = 'v2'
    host.requestUpdate()
    await host.updateComplete

    await Promise.all([
      expect(mutation.mutateAsync(-1)).rejects.toThrow('freshness-failure'),
      vi.advanceTimersByTimeAsync(10),
    ])
    expect(callbackEvents.slice(2)).toEqual(['error:v2', 'settled:v2'])
  })

  it('should not process detached updates when disconnected while in-flight', async () => {
    class Host extends LitElement {
      updatesRequested = 0

      readonly mutation = createMutationController(
        this,
        {
          mutationFn: (value: number) => sleep(10).then(() => value + 10),
        },
        queryClient,
      )

      override requestUpdate(
        ...args: Parameters<LitElement['requestUpdate']>
      ): void {
        this.updatesRequested += 1
        super.requestUpdate(...args)
      }
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    const { mutation } = host

    container.append(host)
    await host.updateComplete

    mutation.mutate(1)
    host.remove()
    await host.updateComplete
    const updatesAfterDisconnect = host.updatesRequested
    await vi.advanceTimersByTimeAsync(10)
    expect(host.updatesRequested).toBe(updatesAfterDisconnect)
  })

  it('should become a deterministic missing-client state when the provider is missing', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly mutationKey = key

      readonly mutation = createMutationController(this, {
        mutationKey: this.mutationKey,
        mutationFn: (value: number) => sleep(10).then(() => value + 1),
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    const placeholderResult = consumer.mutation()

    expect(placeholderResult.isIdle).toBe(true)
    expect(placeholderResult.isPaused).toBe(false)

    container.append(consumer)
    expect(() => consumer.mutation()).not.toThrow()
    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.mutation()).toThrow(/No QueryClient available/)
    expect(() => consumer.mutation.mutate(1)).toThrow(
      /No QueryClient available/,
    )
    await expect(consumer.mutation.mutateAsync(1)).rejects.toThrow(
      /No QueryClient available/,
    )
    await expect(placeholderResult.mutate(1)).rejects.toThrow(
      /No QueryClient available/,
    )

    expect(() => consumer.mutation.reset()).not.toThrow()
    expect(() => placeholderResult.reset()).not.toThrow()

    consumer.mutation.destroy()
    consumer.remove()
  })

  it('should recover without reconstruction when a valid provider is adopted later', async () => {
    const key = queryKey()

    class Consumer extends LitElement {
      readonly mutationKey = key

      readonly mutation = createMutationController(this, {
        mutationKey: this.mutationKey,
        mutationFn: (value: number) => sleep(10).then(() => value + 1),
      })
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    container.append(consumer)
    await vi.advanceTimersByTimeAsync(0)
    expect(() => consumer.mutation()).toThrow(/No QueryClient available/)

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient
    provider.append(consumer)

    container.append(provider)
    await provider.updateComplete

    const mutatePromise = consumer.mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(mutatePromise).resolves.toBe(2)
    expect(consumer.mutation().isSuccess).toBe(true)

    consumer.mutation.destroy()
    provider.remove()
  })

  it('should not throw for a mutation controller on an already-connected host with an explicit client', async () => {
    // Regression test for SSR hydration scenario where controller is created
    // during willUpdate on an already-connected host.
    class Host extends LitElement {
      mutation?: MutationResultAccessor<number, Error, number, unknown>
    }
    customElements.define(generateElementName(), Host)
    const host = new Host()
    container.append(host)
    await host.updateComplete

    // Lit calls hostConnected immediately when a controller is added to an
    // already-connected host
    host.mutation = createMutationController(
      host,
      {
        mutationKey: queryKey(),
        mutationFn: (value: number) => sleep(10).then(() => value * 2),
      },
      queryClient,
    )
    const mutation = host.mutation

    // Wait for the deferred onConnected to complete
    await vi.advanceTimersByTimeAsync(0)

    // Mutation controller should work correctly
    expect(mutation().isIdle).toBe(true)

    const mutatePromise = mutation.mutateAsync(5)
    await vi.advanceTimersByTimeAsync(10)
    await expect(mutatePromise).resolves.toBe(10)
    expect(mutation().isSuccess).toBe(true)

    mutation.destroy()
  })

  it('should defer explicit-client mutation accessors until host fields are initialized', async () => {
    const key = queryKey()

    class DeferredExplicitMutationHost extends LitElement {
      readonly mutation = createMutationController(
        this,
        () => ({
          mutationKey: [...key, this.id],
          mutationFn: (value: number) =>
            sleep(10).then(() => value + this.offset),
        }),
        queryClient,
      )

      readonly firstRead = this.mutation()
      readonly id = 'alpha'
      readonly offset = 1
    }
    customElements.define(generateElementName(), DeferredExplicitMutationHost)

    expect(() => new DeferredExplicitMutationHost()).not.toThrow()

    const host = new DeferredExplicitMutationHost()
    expect(host.mutation().isIdle).toBe(true)

    container.append(host)

    const mutatePromise = host.mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(mutatePromise).resolves.toBe(2)
    expect(
      queryClient
        .getMutationCache()
        .findAll({ mutationKey: key })
        .map((mutation) => mutation.options.mutationKey),
    ).toEqual([[...key, 'alpha']])

    host.mutation.destroy()
  })

  it('should switch mutation controller to new provider client while connected', async () => {
    const key = queryKey()
    const clientA = new QueryClient()
    const clientB = new QueryClient()

    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = clientA
    container.append(provider)
    await provider.updateComplete

    class Consumer extends LitElement {
      readonly mutationKey = key

      readonly mutation = createMutationController(this, () => ({
        mutationKey: this.mutationKey,
        mutationFn: (value: number) => sleep(10).then(() => value + 1),
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()

    provider.append(consumer)
    await vi.advanceTimersByTimeAsync(0)
    const firstMutation = consumer.mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(firstMutation).resolves.toBe(2)

    const countAAfterFirst = clientA
      .getMutationCache()
      .findAll({ mutationKey: consumer.mutationKey }).length
    expect(countAAfterFirst).toBeGreaterThan(0)

    provider.client = clientB
    await provider.updateComplete
    const secondMutation = consumer.mutation.mutateAsync(2)
    await vi.advanceTimersByTimeAsync(10)
    await expect(secondMutation).resolves.toBe(3)

    const countAAfterSecond = clientA
      .getMutationCache()
      .findAll({ mutationKey: consumer.mutationKey }).length
    const countBAfterSecond = clientB
      .getMutationCache()
      .findAll({ mutationKey: consumer.mutationKey }).length

    expect(countAAfterSecond).toBe(countAAfterFirst)
    expect(countBAfterSecond).toBeGreaterThan(0)

    consumer.mutation.destroy()
    provider.remove()
  })

  it('should reparent mutation controller under a different provider and bind the new nearest client', async () => {
    const key = queryKey()
    const clientA = new QueryClient()
    const clientB = new QueryClient()

    const providerA = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    providerA.client = clientA
    const providerB = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    providerB.client = clientB

    class Consumer extends LitElement {
      readonly mutationKey = key

      readonly mutation = createMutationController(this, () => ({
        mutationKey: this.mutationKey,
        mutationFn: (value: number) => sleep(10).then(() => value + 1),
      }))
    }
    customElements.define(generateElementName(), Consumer)
    const consumer = new Consumer()
    providerA.append(consumer)

    container.append(providerA)
    await providerA.updateComplete

    const firstMutation = consumer.mutation.mutateAsync(1)
    await vi.advanceTimersByTimeAsync(10)
    await expect(firstMutation).resolves.toBe(2)

    consumer.remove()
    providerA.remove()

    providerB.append(consumer)
    container.append(providerB)
    await providerB.updateComplete

    const secondMutation = consumer.mutation.mutateAsync(2)
    await vi.advanceTimersByTimeAsync(10)
    await expect(secondMutation).resolves.toBe(3)
    expect(
      clientA.getMutationCache().findAll({ mutationKey: consumer.mutationKey })
        .length,
    ).toBeGreaterThan(0)
    expect(
      clientB.getMutationCache().findAll({ mutationKey: consumer.mutationKey })
        .length,
    ).toBeGreaterThan(0)

    consumer.mutation.destroy()
    providerB.remove()
  })
})
