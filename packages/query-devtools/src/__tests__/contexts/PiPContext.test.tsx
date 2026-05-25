import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@solidjs/testing-library'
import { createEffect } from 'solid-js'
import { createLocalStorage } from '@solid-primitives/storage'
import { PiPProvider, usePiPWindow } from '../../contexts'

type FakePipWindow = Pick<
  Window,
  | 'document'
  | 'innerWidth'
  | 'innerHeight'
  | 'addEventListener'
  | 'removeEventListener'
  | 'close'
>

function stubPipWindow(overrides: Partial<FakePipWindow> = {}) {
  const pipDocument = document.implementation.createHTMLDocument('PiP')
  const fakeWindow: FakePipWindow = {
    document: pipDocument,
    innerWidth: 800,
    innerHeight: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
    ...overrides,
  }
  const open = vi.fn(() => fakeWindow)
  vi.stubGlobal('open', open)
  return { pipDocument, fakeWindow, open }
}

describe('PiPContext', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function renderAndAct(
    action: (pip: ReturnType<typeof usePiPWindow>) => void,
  ) {
    render(() => {
      const [localStore, setLocalStore] = createLocalStorage({
        prefix: 'TanstackQueryDevtools',
      })
      return (
        <PiPProvider localStore={localStore} setLocalStore={setLocalStore}>
          <PiPActor run={action} />
        </PiPProvider>
      )
    })
  }

  function PiPActor(props: {
    run: (pip: ReturnType<typeof usePiPWindow>) => void
  }) {
    const pip = usePiPWindow()
    createEffect(() => {
      pip()
      props.run(pip)
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
  })
})
