import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@solidjs/testing-library'
import { createEffect } from 'solid-js'
import { createLocalStorage } from '@solid-primitives/storage'
import { PiPProvider, usePiPWindow } from '../../contexts'

type FakePipWindowOverrides = {
  document?: Document
  innerWidth?: number
  innerHeight?: number
}

function stubPipWindow(overrides: FakePipWindowOverrides = {}) {
  const pipDocument =
    overrides.document ?? document.implementation.createHTMLDocument('PiP')
  const fakeWindow = {
    document: pipDocument,
    innerWidth: overrides.innerWidth ?? 800,
    innerHeight: overrides.innerHeight ?? 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
  }
  const open = vi.fn(() => fakeWindow)
  vi.stubGlobal('open', open)
  return { pipDocument, fakeWindow, open }
}

describe('PiPContext', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  function renderAndAct(
    action: (pip: ReturnType<typeof usePiPWindow>) => void,
    options: {
      disabled?: boolean
      initialStorage?: Record<string, string>
    } = {},
  ) {
    Object.entries(options.initialStorage ?? {}).forEach(([key, value]) => {
      localStorage.setItem(key, value)
    })
    render(() => {
      const [localStore, setLocalStore] = createLocalStorage({
        prefix: 'TanstackQueryDevtools',
      })
      return (
        <PiPProvider
          localStore={localStore}
          setLocalStore={setLocalStore}
          disabled={options.disabled}
        >
          <PiPActor run={action} />
        </PiPProvider>
      )
    })
  }

  function PiPActor(props: {
    run: (pip: ReturnType<typeof usePiPWindow>) => void
  }) {
    const pip = usePiPWindow()
    let hasRun = false
    createEffect(() => {
      pip()
      if (!hasRun) {
        hasRun = true
        props.run(pip)
      }
    })
    return null
  }

  describe('usePiPWindow', () => {
    it('should throw when used outside a "PiPProvider"', () => {
      function PiPProbe() {
        usePiPWindow()
        return null
      }

      expect(() => render(() => <PiPProbe />)).toThrow(
        'usePiPWindow must be used within a PiPProvider',
      )
    })
  })

  describe('"requestPipWindow"', () => {
    it('should call "window.open" with the expected target and features', () => {
      const { open } = stubPipWindow()

      renderAndAct((pip) => pip().requestPipWindow(640, 480))

      expect(open).toHaveBeenCalledWith(
        '',
        'TSQD-Devtools-Panel',
        'width=640,height=480,popup',
      )
    })

    it('should set the "pipWindow" signal to the opened window', () => {
      const { fakeWindow } = stubPipWindow()
      let observed: Window | null = null

      renderAndAct((pip) => {
        pip().requestPipWindow(640, 480)
        observed = pip().pipWindow
      })

      expect(observed).toBe(fakeWindow)
    })

    it('should persist "pip_open" as "true" to "localStore" after a successful open', () => {
      stubPipWindow()

      renderAndAct((pip) => pip().requestPipWindow(640, 480))

      expect(localStorage.getItem('TanstackQueryDevtools.pip_open')).toBe(
        'true',
      )
    })

    it('should set the PiP document title to "TanStack Query Devtools"', () => {
      const { pipDocument } = stubPipWindow()

      renderAndAct((pip) => pip().requestPipWindow(640, 480))

      expect(pipDocument.title).toBe('TanStack Query Devtools')
    })

    it('should reset the PiP document body margin to "0"', () => {
      const { pipDocument } = stubPipWindow()

      renderAndAct((pip) => pip().requestPipWindow(640, 480))

      expect(pipDocument.body.style.margin).toMatch(/^0(px)?$/)
    })

    it('should clear any existing nodes in the PiP document "head"', () => {
      const { pipDocument } = stubPipWindow()
      pipDocument.head.appendChild(pipDocument.createElement('meta'))

      renderAndAct((pip) => pip().requestPipWindow(640, 480))

      expect(pipDocument.head.querySelector('meta')).toBeNull()
    })

    it('should clear any existing nodes in the PiP document "body"', () => {
      const { pipDocument } = stubPipWindow()
      const leftover = pipDocument.createElement('div')
      leftover.id = 'leftover'
      pipDocument.body.appendChild(leftover)

      renderAndAct((pip) => pip().requestPipWindow(640, 480))

      expect(pipDocument.body.querySelector('#leftover')).toBeNull()
    })
  })

  describe('styleSheet propagation', () => {
    type FakeCssRule = { readonly cssText: string }
    type FakeStyleSheet = {
      readonly cssRules?: ArrayLike<FakeCssRule>
      readonly href?: string | null
      readonly type?: string
      readonly media?: { toString: () => string }
      readonly ownerNode?: Element | null
    }

    function makeCssRules(...cssTexts: Array<string>): ArrayLike<FakeCssRule> {
      return cssTexts.map((cssText) => ({ cssText }))
    }

    function stubParentStyleSheet(sheet: FakeStyleSheet) {
      return vi
        .spyOn(document, 'styleSheets', 'get')
        .mockReturnValue([sheet] as unknown as StyleSheetList)
    }

    it('should copy parent stylesheets as "<style>" with the same id into the PiP document head', () => {
      const sourceStyle = document.createElement('style')
      sourceStyle.id = 'tsqd-source'
      const sheetSpy = stubParentStyleSheet({
        cssRules: makeCssRules('.tsqd { color: red; }'),
        ownerNode: sourceStyle,
      })
      const { pipDocument } = stubPipWindow()

      try {
        renderAndAct((pip) => pip().requestPipWindow(640, 480))

        const copied = pipDocument.head.querySelector('style#tsqd-source')
        expect(copied).not.toBeNull()
        expect(copied?.textContent).toBe('.tsqd { color: red; }')
      } finally {
        sheetSpy.mockRestore()
      }
    })

    it('should fall back to a "<link>" for cross-origin stylesheets whose "cssRules" throw', () => {
      const sheetSpy = stubParentStyleSheet({
        get cssRules(): CSSRuleList {
          throw new DOMException('blocked', 'SecurityError')
        },
        href: 'https://example.com/external.css',
        type: 'text/css',
        media: { toString: () => 'all' },
      })
      const { pipDocument } = stubPipWindow()

      try {
        renderAndAct((pip) => pip().requestPipWindow(640, 480))

        const link = pipDocument.head.querySelector<HTMLLinkElement>(
          'link[href="https://example.com/external.css"]',
        )
        expect(link).not.toBeNull()
        expect(link?.rel).toBe('stylesheet')
      } finally {
        sheetSpy.mockRestore()
      }
    })

    it('should skip the "<link>" fallback when the cross-origin stylesheet has no "href"', () => {
      const sheetSpy = stubParentStyleSheet({
        get cssRules(): CSSRuleList {
          throw new DOMException('blocked', 'SecurityError')
        },
        href: null,
        type: 'text/css',
        media: { toString: () => 'all' },
      })
      const { pipDocument } = stubPipWindow()

      try {
        renderAndAct((pip) => pip().requestPipWindow(640, 480))

        expect(pipDocument.head.querySelector('link')).toBeNull()
        expect(pipDocument.head.querySelector('style')).toBeNull()
      } finally {
        sheetSpy.mockRestore()
      }
    })
  })

  describe('"pagehide" lifecycle', () => {
    it('should reset the "pipWindow" signal and "pip_open" when the "pagehide" event fires on the opened window', () => {
      const { fakeWindow } = stubPipWindow()
      const observed: Array<Window | null> = []

      renderAndAct(
        (pip) => {
          pip().requestPipWindow(640, 480)
          observed.push(pip().pipWindow)
          const pagehideHandler = fakeWindow.addEventListener.mock.calls.find(
            ([event]) => event === 'pagehide',
          )?.[1]
          pagehideHandler?.()
          observed.push(pip().pipWindow)
        },
        { disabled: true },
      )

      expect(observed).toEqual([fakeWindow, null])
      expect(localStorage.getItem('TanstackQueryDevtools.pip_open')).toBe(
        'false',
      )
    })
  })

  describe('"closePipWindow"', () => {
    it('should be a noop when no window is open', () => {
      const { fakeWindow } = stubPipWindow()

      renderAndAct((pip) => {
        pip().closePipWindow()
      })

      expect(fakeWindow.close).not.toHaveBeenCalled()
    })

    it('should call "close" on the opened window and reset the "pipWindow" signal', () => {
      const { fakeWindow } = stubPipWindow()
      const observed: Array<Window | null> = []

      renderAndAct(
        (pip) => {
          pip().requestPipWindow(640, 480)
          observed.push(pip().pipWindow)
          pip().closePipWindow()
          observed.push(pip().pipWindow)
        },
        { disabled: true },
      )

      expect(fakeWindow.close).toHaveBeenCalledTimes(1)
      expect(observed).toEqual([fakeWindow, null])
    })

    it('should call "close" only once when "closePipWindow" runs twice in a row', () => {
      const { fakeWindow } = stubPipWindow()

      renderAndAct(
        (pip) => {
          pip().requestPipWindow(640, 480)
          pip().closePipWindow()
          pip().closePipWindow()
        },
        { disabled: true },
      )

      expect(fakeWindow.close).toHaveBeenCalledTimes(1)
    })
  })

  describe('"pip_open" auto-open createEffect', () => {
    it('should auto-open a PiP window when "pip_open" is "true" on mount', () => {
      const { open } = stubPipWindow()

      renderAndAct(() => {}, {
        initialStorage: { 'TanstackQueryDevtools.pip_open': 'true' },
      })

      expect(open).toHaveBeenCalled()
    })

    it('should not auto-open a PiP window when "disabled" is true', () => {
      const { open } = stubPipWindow()

      renderAndAct(() => {}, {
        disabled: true,
        initialStorage: { 'TanstackQueryDevtools.pip_open': 'true' },
      })

      expect(open).not.toHaveBeenCalled()
    })

    it('should reset "pip_open"/"open" and log when "window.open" returns null on auto-open', () => {
      vi.stubGlobal(
        'open',
        vi.fn(() => null),
      )
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      try {
        renderAndAct(() => {}, {
          initialStorage: { 'TanstackQueryDevtools.pip_open': 'true' },
        })

        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('Failed to open popup'),
        )
        expect(localStorage.getItem('TanstackQueryDevtools.pip_open')).toBe(
          'false',
        )
        expect(localStorage.getItem('TanstackQueryDevtools.open')).toBe('false')
      } finally {
        consoleError.mockRestore()
      }
    })

    it('should re-throw non-"PipOpenError" errors from "window.open" on auto-open', () => {
      vi.stubGlobal(
        'open',
        vi.fn(() => {
          throw new Error('unexpected')
        }),
      )

      expect(() =>
        renderAndAct(() => {}, {
          initialStorage: { 'TanstackQueryDevtools.pip_open': 'true' },
        }),
      ).toThrow('unexpected')
    })
  })

  describe('"#_goober" MutationObserver', () => {
    function stubMutationObserver() {
      let observerCallback: MutationCallback | undefined
      const observeSpy = vi.fn()
      const disconnectSpy = vi.fn()
      class FakeMutationObserver {
        observe = observeSpy
        disconnect = disconnectSpy
        takeRecords = () => []
        constructor(cb: MutationCallback) {
          observerCallback = cb
        }
      }
      vi.stubGlobal('MutationObserver', FakeMutationObserver)
      return {
        observeSpy,
        disconnectSpy,
        fire: () => observerCallback?.([], {} as MutationObserver),
      }
    }

    it('should observe the parent "#_goober" style for childList and subtree mutations', () => {
      const gooberStyle = document.createElement('style')
      gooberStyle.id = '_goober'
      gooberStyle.textContent = '.initial { color: red; }'
      document.head.appendChild(gooberStyle)
      const { observeSpy } = stubMutationObserver()
      stubPipWindow()

      try {
        renderAndAct((pip) => pip().requestPipWindow(640, 480), {
          disabled: true,
        })

        expect(observeSpy).toHaveBeenCalledWith(
          gooberStyle,
          expect.objectContaining({ childList: true, subtree: true }),
        )
      } finally {
        gooberStyle.remove()
      }
    })

    it('should copy parent "#_goober" "textContent" into the PiP mirror when the observer fires', () => {
      const gooberStyle = document.createElement('style')
      gooberStyle.id = '_goober'
      gooberStyle.textContent = '.initial { color: red; }'
      document.head.appendChild(gooberStyle)
      const { fire } = stubMutationObserver()
      const { pipDocument } = stubPipWindow()

      try {
        const pipGooberStyle = pipDocument.createElement('style')
        pipGooberStyle.id = '_goober'

        renderAndAct(
          (pip) => {
            pip().requestPipWindow(640, 480)
            // `requestPipWindow` clears the PiP document head, so install
            // the goober mirror style after that point.
            pipDocument.head.appendChild(pipGooberStyle)
          },
          { disabled: true },
        )

        gooberStyle.textContent = '.next { color: blue; }'
        fire()

        expect(pipGooberStyle.textContent).toBe('.next { color: blue; }')
      } finally {
        gooberStyle.remove()
      }
    })
  })
})
