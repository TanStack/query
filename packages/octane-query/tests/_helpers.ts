/**
 * Test helpers — thin wrapper around createRoot + flushSync so tests can
 * mount a component, inspect the DOM, fire events, and unmount cleanly.
 */
import {
  createRoot,
  delegateEvents,
  drainPassiveEffects,
  flushSync,
} from 'octane'
import type { ComponentBody, Root } from 'octane'

// Delegated events used by test fixtures. Setup-once.
delegateEvents(['click', 'input', 'change', 'keydown', 'submit'])

interface MountResult {
  container: HTMLElement
  root: Root
  html: () => string
  unmount: () => void
  click: (selector: string) => void
  find: (selector: string) => Element
  findAll: (selector: string) => Array<Element>
  /** Re-render with new props (drains queued renders synchronously). */
  update: <TProps>(body: ComponentBody<TProps>, props?: TProps) => void
}

export function mount<TProps = undefined>(
  body: ComponentBody<TProps>,
  props?: TProps,
): MountResult {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  try {
    root.render(body, props)
    flushSync(() => {})
  } catch (err) {
    // A throwing initial render can't be unmounted by the caller because mount
    // never returns. Release the root's delegation/ownership registrations as
    // well as its container before preserving the original render error.
    try {
      root.unmount()
    } finally {
      container.remove()
    }
    throw err
  }
  return {
    container,
    root,
    html() {
      return container.innerHTML
    },
    unmount() {
      root.unmount()
      container.remove()
    },
    click(selector) {
      const el = container.querySelector(selector)
      if (!el) throw new Error(`no element matching ${selector}`)
      flushSync(() => {
        // HTMLElement has `.click()`. SVGElement / MathMLElement do NOT
        // (they're not in the HTMLElement prototype chain), so we dispatch
        // a bubbling click event explicitly — matches the real browser path
        // the runtime listens on at the delegation root.
        if (typeof (el as HTMLElement).click === 'function') {
          ;(el as HTMLElement).click()
        } else {
          el.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true }),
          )
        }
      })
    },
    find(selector) {
      const el = container.querySelector(selector)
      if (!el) throw new Error(`no element matching ${selector}`)
      return el
    },
    findAll(selector) {
      return Array.from(container.querySelectorAll(selector))
    },
    update(nextBody, nextProps) {
      flushSync(() => root.render(nextBody, nextProps))
    },
  }
}

/** Older name kept for tests that read more naturally with it. */
export function nextPaint(): Promise<void> {
  drainPassiveEffects()
  return Promise.resolve()
}
