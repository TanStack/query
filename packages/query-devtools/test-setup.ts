import '@testing-library/jest-dom/vitest'
import { cleanup } from '@solidjs/testing-library'
import { afterEach, beforeEach, vi } from 'vitest'

const scrollToDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollTo',
)
const isList = (element: HTMLElement) =>
  element.matches(
    '.tsqd-queries-overflow-container, .tsqd-mutations-overflow-container, .test-virtual-list',
  )

// jsdom has no `adoptedStyleSheets`, which the devtools use to add their styles.
for (const prototype of [Document.prototype, ShadowRoot.prototype]) {
  const adopted = new WeakMap<object, Array<CSSStyleSheet>>()
  Object.defineProperty(prototype, 'adoptedStyleSheets', {
    configurable: true,
    get() {
      return adopted.get(this) ?? []
    },
    set(sheets: Array<CSSStyleSheet>) {
      adopted.set(this, sheets)
    },
  })
}

beforeEach(() => {
  vi.stubGlobal('CSS', { ...globalThis.CSS, highlights: new Map() })
  vi.stubGlobal('Highlight', Set)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return isList(this) ? 410 : 0
    },
  )
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
    function (this: HTMLElement) {
      return isList(this) ? 1000 : 0
    },
  )
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.hasAttribute('data-index')
        ? Number(this.firstElementChild?.getAttribute('data-height') ?? 28)
        : 0
    },
  )
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      if (!isList(this)) return 0
      const content = this.firstElementChild
      return content instanceof HTMLElement
        ? Number.parseFloat(content.style.height) || 0
        : 0
    },
  )
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value(this: HTMLElement, options: ScrollToOptions) {
      const next = Math.max(
        0,
        Math.min(options.top ?? 0, this.scrollHeight - this.clientHeight),
      )
      if (next !== this.scrollTop) {
        this.scrollTop = next
        this.dispatchEvent(new Event('scroll'))
      }
    },
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  if (scrollToDescriptor) {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', scrollToDescriptor)
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
  }
})
