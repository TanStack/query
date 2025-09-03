import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js'
import { clearDelegatedEvents, delegateEvents } from 'solid-js/web'
import { PIP_DEFAULT_HEIGHT } from '../constants'
import { useQueryDevtoolsContext } from './QueryDevtoolsContext'
import type { Accessor, JSX } from 'solid-js'
import type { StorageObject, StorageSetter } from '@solid-primitives/storage'

interface PiPProviderProps {
  children: JSX.Element
  localStore: StorageObject<string>
  setLocalStore: StorageSetter<string, unknown>
  disabled?: boolean
}

type PiPContextType = {
  pipWindow: Window | null
  requestPipWindow: (width: number, height: number) => void
  closePipWindow: () => void
  disabled: boolean
}

const PiPContext = createContext<Accessor<PiPContextType> | undefined>(
  undefined,
)

export const PiPProvider = (props: PiPProviderProps) => {
  // Expose pipWindow that is currently active
  const [pipWindow, setPipWindow] = createSignal<Window | null>(null)

  // Close pipWindow programmatically
  const closePipWindow = () => {
    const w = pipWindow()
    if (w != null) {
      w.close()
      setPipWindow(null)
    }
  }

  // Open new pipWindow
  const requestPipWindow = (width: number, height: number) => {
    // We don't want to allow multiple requests.
    if (pipWindow() != null) {
      return
    }

    const pip = window.open(
      '',
      'TSQD-Devtools-Panel',
      `width=${width},height=${height},popup`,
    )

    if (!pip) {
      throw new Error(
        'Failed to open popup. Please allow popups for this site to view the devtools in picture-in-picture mode.',
      )
    }

    // Remove existing styles
    pip.document.head.innerHTML = ''
    // Remove existing body
    pip.document.body.innerHTML = ''
    // Clear Delegated Events
    clearDelegatedEvents(pip.document)

    pip.document.title = 'TanStack Query Devtools'
    pip.document.body.style.margin = '0'

    // Detect when window is closed by user
    pip.addEventListener('pagehide', () => {
      props.setLocalStore('pip_open', 'false')
      setPipWindow(null)
    })

    // It is important to copy all parent window styles. Otherwise, there would be no CSS available at all
    // https://developer.chrome.com/docs/web-platform/document-picture-in-picture/#copy-style-sheets-to-the-picture-in-picture-window
    ;[
      ...(useQueryDevtoolsContext().shadowDOMTarget || document).styleSheets,
    ].forEach((styleSheet) => {
      try {
        const cssRules = [...styleSheet.cssRules]
          .map((rule) => rule.cssText)
          .join('')
        const style = document.createElement('style')
        const style_node = styleSheet.ownerNode
        let style_id = ''

        if (style_node && 'id' in style_node) {
          style_id = style_node.id
        }

        if (style_id) {
          style.setAttribute('id', style_id)
        }
        style.textContent = cssRules
        pip.document.head.appendChild(style)
      } catch (e) {
        const link = document.createElement('link')
        if (styleSheet.href == null) {
          return
        }

        link.rel = 'stylesheet'
        link.type = styleSheet.type
        link.media = styleSheet.media.toString()
        link.href = styleSheet.href
        pip.document.head.appendChild(link)
      }
    })
    delegateEvents(
      [
        'focusin',
        'focusout',
        'pointermove',
        'keydown',
        'pointerdown',
        'pointerup',
        'click',
        'mousedown',
        'input',
      ],
      pip.document,
    )
    props.setLocalStore('pip_open', 'true')
    setPipWindow(pip)
  }

  createEffect(() => {
    const pip_open = (props.localStore.pip_open ?? 'false') as 'true' | 'false'
    if (pip_open === 'true' && !props.disabled) {
      requestPipWindow(
        Number(window.innerWidth),
        Number(props.localStore.height || PIP_DEFAULT_HEIGHT),
      )
    }
  })

  createEffect(() => {
    // Setup mutation observer for goober styles with id `_goober
    const gooberStyles = (
      useQueryDevtoolsContext().shadowDOMTarget || document
    ).querySelector('#_goober')
    const w = pipWindow()
    if (gooberStyles && w) {
      const observer = new MutationObserver(() => {
        const pip_style = (
          useQueryDevtoolsContext().shadowDOMTarget || w.document
        ).querySelector('#_goober')
        if (pip_style) {
          pip_style.textContent = gooberStyles.textContent
        }
      })
      observer.observe(gooberStyles, {
        childList: true, // observe direct children
        subtree: true, // and lower descendants too
        characterDataOldValue: true, // pass old data to callback
      })
      onCleanup(() => {
        observer.disconnect()
      })
    }
  })

  const value = createMemo(() => ({
    pipWindow: pipWindow(),
    requestPipWindow,
    closePipWindow,
    disabled: props.disabled ?? false,
  }))

  return (
    <PiPContext.Provider value={value}>{props.children}</PiPContext.Provider>
  )
}

export const usePiPWindow = () => {
  const context = createMemo(() => {
    const ctx = useContext(PiPContext)
    if (!ctx) {
      throw new Error('usePiPWindow must be used within a PiPProvider')
    }
    return ctx()
  })
  return context
}
