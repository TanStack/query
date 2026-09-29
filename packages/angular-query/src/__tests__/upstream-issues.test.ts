import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ResourceParamsStatus,
  VERSION,
  computed,
  effect,
  input,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QueryClient,
  injectMutation,
  injectQuery,
  provideTanStackQuery,
  toResource,
} from '..'
import { provideAngularQueryChangeDetection } from './test-utils'

// Reproductions transcribed from TanStack/query issues. Use real promises and
// Angular stability, without notification-scheduler overrides or timer flushes.
describe('upstream Angular issue reproductions', () => {
  let client: QueryClient

  beforeEach(() => {
    vi.useRealTimers()
    if (
      process.env.ANGULAR_ISSUE_VERSION &&
      VERSION.full !== process.env.ANGULAR_ISSUE_VERSION
    ) {
      throw new Error(`Unexpected Angular runtime: ${VERSION.full}`)
    }
    client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    })
    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => client),
      ],
    })
  })

  afterEach(() => {
    TestBed.resetTestingModule()
    client.clear()
  })

  it('#9910: a template signal read does not prevent whenStable from seeing success', async () => {
    @Component({ template: '{{ query.isSuccess() }}' })
    class App {
      query = injectQuery(() => ({
        queryKey: ['9910'],
        queryFn: () => Promise.resolve([1, 2, 3, 4, 5]),
      }))
    }
    const fixture = TestBed.createComponent(App)
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.componentInstance.query.isSuccess()).toBe(true)
    expect(fixture.componentInstance.query.data()).toEqual([1, 2, 3, 4, 5])
    expect(fixture.nativeElement.textContent).toBe('true')
  })

  it('#10046: a class-field data alias is populated after whenStable', async () => {
    @Component({ template: '{{ data() }}' })
    class App {
      query = injectQuery(() => ({
        queryKey: ['10046'],
        queryFn: () => Promise.resolve('loaded'),
      }))
      data = this.query.data
    }
    const fixture = TestBed.createComponent(App)
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.componentInstance.data()).toBe('loaded')
    expect(fixture.nativeElement.textContent).toBe('loaded')
  })

  it.each(['TestBed', 'Testing Library'] as const)(
    '#9981: an isSuccess effect updates component state using %s',
    async (runner) => {
      @Component({
        template: '{{ value }}',
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class App {
        value = 42
        query = injectQuery(() => ({
          queryKey: ['9981'],
          queryFn: () => Promise.resolve([30, 40, 50]),
        }))
        constructor() {
          effect(() => {
            if (this.query.isSuccess()) this.value = 9999
          })
        }
      }
      const fixture =
        runner === 'TestBed'
          ? TestBed.createComponent(App)
          : (await (await import('@testing-library/angular')).render(App))
              .fixture
      fixture.detectChanges()
      await fixture.whenStable()
      fixture.detectChanges()
      expect(fixture.componentInstance.value).toBe(9999)
    },
  )

  it('#7488: taking a data alias does not read an unset required input', async () => {
    const optionsRead = vi.fn()
    @Component({ template: '{{ data() }}' })
    class App {
      name = input.required<string>()
      data = injectQuery(() => {
        optionsRead()
        return {
          queryKey: ['7488', this.name()],
          queryFn: () => Promise.resolve(this.name()),
        }
      }).data
    }
    const fixture = TestBed.createComponent(App)
    expect(optionsRead).not.toHaveBeenCalled()
    fixture.componentRef.setInput('name', 'ready')
    fixture.detectChanges()
    await fixture.whenStable()
    expect(fixture.componentInstance.data()).toBe('ready')
    expect(optionsRead).toHaveBeenCalledTimes(1)
  })

  it.each(['constructor', 'ngOnInit', 'ngAfterContentInit'] as const)(
    '#9020: mutate immediately exposes pending from %s',
    async (phase) => {
      let finish!: (value: string) => void
      const request = new Promise<string>((resolve) => {
        finish = resolve
      })
      @Component({ template: '{{ mutation.status() }}' })
      class App {
        immediate = ''
        mutation = injectMutation(() => ({ mutationFn: () => request }))
        constructor() {
          if (phase === 'constructor') this.start()
        }
        ngOnInit() {
          if (phase === 'ngOnInit') this.start()
        }
        ngAfterContentInit() {
          if (phase === 'ngAfterContentInit') this.start()
        }
        start() {
          this.mutation.mutate()
          this.immediate = this.mutation.status()
        }
      }
      const fixture = TestBed.createComponent(App)
      fixture.detectChanges()
      expect(fixture.componentInstance.immediate).toBe('pending')
      expect(fixture.nativeElement.textContent).toBe('pending')
      finish('done')
      await fixture.whenStable()
      expect(fixture.componentInstance.mutation.data()).toBe('done')
    },
  )

  it('#11176: whenStable waits for a just-triggered fire-and-forget mutation', async () => {
    const app = TestBed.inject(ApplicationRef)
    const mutation = TestBed.runInInjectionContext(() =>
      injectMutation(() => ({
        mutationFn: (value: string) =>
          new Promise<string>((resolve) => {
            setTimeout(() => resolve(value), 5)
          }),
      })),
    )
    TestBed.tick()
    mutation.mutate('mutated')
    await app.whenStable()
    expect(mutation.status()).toBe('success')
    expect(mutation.data()).toBe('mutated')
  })

  it.each([false, true])(
    '#11176: a newer mutation settling cannot release an older invocation (reset=%s)',
    async (reset) => {
      let finish!: () => void
      const first = new Promise<void>((resolve) => {
        finish = resolve
      })
      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationFn: (request: Promise<void>) => request,
        })),
      )
      TestBed.tick()
      mutation.mutate(first)
      if (reset) mutation.reset()
      const second = mutation.mutateAsync(Promise.resolve())
      let stable = false
      const settled = TestBed.inject(ApplicationRef)
        .whenStable()
        .then(() => {
          stable = true
        })
      await second
      expect(stable).toBe(false)
      finish()
      await settled
      expect(stable).toBe(true)
    },
  )

  it('#9735: saving an edit exposes optimistic data in the same turn and render', async () => {
    const snapshots: Array<string | undefined> = []
    @Component({
      template: '@if (!editing()) { <output>{{ query.data() }}</output> }',
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class App {
      editing = signal(true)
      query = injectQuery(() => ({
        queryKey: ['9735'],
        queryFn: () => Promise.resolve('old title'),
        initialData: 'old title',
        staleTime: Infinity,
      }))
      mutation = injectMutation(() => ({
        mutationFn: async (title: string) => title,
        onMutate: (title: string) => {
          client.setQueryData(['9735'], title)
          snapshots.push(this.query.data())
        },
      }))
      save() {
        this.mutation.mutate('new title')
        this.editing.set(false)
        snapshots.push(this.query.data())
      }
    }
    const fixture = TestBed.createComponent(App)
    fixture.detectChanges()
    fixture.componentInstance.save()
    expect(snapshots).toEqual(['new title', 'new title'])
    expect(client.getQueryData(['9735'])).toBe('new title')
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toBe('new title')
    await fixture.whenStable()
  })

  it('#6567: changing to another cached key updates data immediately', () => {
    client.setQueryData(['6567', 'a'], 'A')
    client.setQueryData(['6567', 'b'], 'B')
    const key = signal('a')
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['6567', key()],
        enabled: false,
      })),
    )
    expect(query.data()).toBe('A')
    TestBed.tick()
    key.set('b')
    expect(query.data()).toBe('B')
  })

  it('#6771: enabling a fresh cached query and immediately refetching settles', async () => {
    client.setQueryData(['6771'], 'cached')
    const enabled = signal(false)
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => ({
        queryKey: ['6771'],
        enabled: enabled(),
        staleTime: Infinity,
        queryFn: () => Promise.resolve('updated'),
      })),
    )
    TestBed.tick()
    enabled.set(true)
    await query.refetch()
    await TestBed.inject(ApplicationRef).whenStable()
    expect(query.data()).toBe('updated')
    expect(query.isRefetching()).toBe(false)
  })

  it('#11586: toResource handles debounced parameters throwing ResourceParamsStatus.LOADING or IDLE', async () => {
    const param = signal<string | null | undefined>(null)
    const debouncedParam = computed(() => {
      const val = param()
      if (val === null) {
        throw ResourceParamsStatus.LOADING
      }
      if (val === undefined) {
        throw ResourceParamsStatus.IDLE
      }
      return val
    })

    const app = TestBed.inject(ApplicationRef)
    const resource = TestBed.runInInjectionContext(() => {
      const query = injectQuery(() => {
        const code = debouncedParam()
        return {
          queryKey: ['11586', code],
          queryFn: () => Promise.resolve(`result-${code}`),
        }
      })
      return toResource(query)
    })

    TestBed.tick()
    expect(resource.status()).toBe('loading')
    expect(resource.isLoading()).toBe(true)

    param.set(undefined)
    TestBed.tick()
    expect(resource.status()).toBe('idle')
    expect(resource.isLoading()).toBe(false)

    param.set('settled')
    TestBed.tick()
    await app.whenStable()

    expect(resource.status()).toBe('resolved')
    expect(resource.value()).toBe('result-settled')
  })

  it('#11586: injectQuery gracefully suspends when optionsFn throws ResourceParamsStatus without unhandled effect errors', async () => {
    const param = signal<string | null>(null)
    const debouncedParam = computed(() => {
      const val = param()
      if (val === null) {
        throw ResourceParamsStatus.LOADING
      }
      return val
    })

    const app = TestBed.inject(ApplicationRef)
    const query = TestBed.runInInjectionContext(() =>
      injectQuery(() => {
        const code = debouncedParam()
        return {
          queryKey: ['11586-bare', code],
          queryFn: () => Promise.resolve(`data-${code}`),
        }
      }),
    )

    TestBed.tick()
    expect(query.isPending()).toBe(true)
    expect(query.fetchStatus()).toBe('idle')

    param.set('ready')
    TestBed.tick()
    await app.whenStable()

    expect(query.isSuccess()).toBe(true)
    expect(query.data()).toBe('data-ready')
  })
})
