import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'
import { VirtualList } from '../VirtualList'

type Item = { id: string; label: string; height: number }

describe('VirtualList', () => {
  let observers: Array<{
    callback: ResizeObserverCallback
    observer: ResizeObserver
    targets: Set<Element>
  }>

  beforeEach(() => {
    observers = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        targets = new Set<Element>()
        constructor(callback: ResizeObserverCallback) {
          observers.push({ callback, observer: this, targets: this.targets })
        }
        observe(target: Element) {
          this.targets.add(target)
        }
        unobserve(target: Element) {
          this.targets.delete(target)
        }
        disconnect() {
          this.targets.clear()
        }
      },
    )
  })

  function resizeRow(element: HTMLElement, height: number) {
    for (const { callback, observer, targets } of observers) {
      if (!targets.has(element)) continue
      const size = [{ blockSize: height, inlineSize: 1000 }]
      callback(
        [
          {
            target: element,
            contentRect: new DOMRectReadOnly(0, 0, 1000, height),
            borderBoxSize: size,
            contentBoxSize: size,
            devicePixelContentBoxSize: size,
          },
        ],
        observer,
      )
    }
  }

  function renderList() {
    const original = Array.from({ length: 2000 }, (_, index) => ({
      id: String(index),
      label: `Item ${index}`,
      height: index % 2 ? 56 : 28,
    }))
    const [items, setItems] = createSignal(original)
    const onClick = vi.fn<(item: Item) => void>()
    const rendered = render(() => (
      <VirtualList
        each={items()}
        getKey={(item) => item.id}
        class="test-virtual-list"
        contentClass="test-virtual-content"
      >
        {(item) => (
          <button data-height={item().height} onClick={() => onClick(item())}>
            {item().label}
          </button>
        )}
      </VirtualList>
    ))
    const viewport = rendered.container.firstElementChild
    if (!(viewport instanceof HTMLDivElement)) {
      throw new Error('Missing list viewport')
    }
    return { ...rendered, items, setItems, onClick, viewport }
  }

  it('bounds mounted rows and scrolls to distant items in both directions', () => {
    const list = renderList()
    expect(list.getAllByRole('button').length).toBeLessThan(100)
    expect(list.getByRole('button', { name: 'Item 0' })).toBeVisible()

    list.viewport.scrollTo({ top: list.viewport.scrollHeight })
    expect(list.getByRole('button', { name: 'Item 1999' })).toBeVisible()
    expect(
      list.queryByRole('button', { name: 'Item 0' }),
    ).not.toBeInTheDocument()
    expect(list.getAllByRole('button').length).toBeLessThan(100)

    list.viewport.scrollTo({ top: 0 })
    expect(list.getByRole('button', { name: 'Item 0' })).toBeVisible()
    expect(
      list.queryByRole('button', { name: 'Item 1999' }),
    ).not.toBeInTheDocument()
  })

  it('keeps click identity after a same-count reorder at a distant offset', () => {
    const list = renderList()
    list.viewport.scrollTo({ top: 28000 })
    list.setItems((items) => [...items].reverse())

    for (const button of list.getAllByRole('button')) {
      fireEvent.click(button)
      expect(list.onClick).toHaveBeenLastCalledWith(
        expect.objectContaining({ label: button.textContent }),
      )
    }

    list.viewport.scrollTo({ top: 0 })
    expect(list.getByRole('button', { name: 'Item 1999' })).toBeVisible()
    list.viewport.scrollTo({ top: list.viewport.scrollHeight })
    expect(list.getByRole('button', { name: 'Item 0' })).toBeVisible()
  })

  it('uses replacement objects for reused keys and new keys at the same index', () => {
    const list = renderList()
    list.viewport.scrollTo({ top: 28000 })
    const button = list.getAllByRole('button')[5]
    assert(button)
    const original = list
      .items()
      .find((item) => item.label === button.textContent)
    assert(original)
    const replacement = { ...original, label: 'Replacement object' }
    list.setItems((items) =>
      items.map((item) => (item === original ? replacement : item)),
    )
    fireEvent.click(list.getByRole('button', { name: 'Replacement object' }))
    expect(list.onClick).toHaveBeenLastCalledWith(replacement)
    expect(list.onClick.mock.lastCall?.[0]).toBe(replacement)
    expect(
      list.queryByRole('button', { name: original.label }),
    ).not.toBeInTheDocument()

    const newKey = { ...replacement, id: 'new-key', label: 'New key' }
    list.setItems((items) =>
      items.map((item) => (item === replacement ? newKey : item)),
    )
    fireEvent.click(list.getByRole('button', { name: 'New key' }))
    expect(list.onClick.mock.lastCall?.[0]).toBe(newKey)
    expect(
      list.queryByRole('button', { name: 'Replacement object' }),
    ).not.toBeInTheDocument()
  })

  it('measures a resized row after its index changes', async () => {
    const list = renderList()
    const button = list.getByRole('button', { name: 'Item 0' })
    list.setItems((items) => {
      const [first, second, ...rest] = items
      assert(first)
      assert(second)
      return [second, first, ...rest]
    })
    expect(list.getByRole('button', { name: 'Item 0' })).toBe(button)
    const wrapper = button.parentElement
    assert(wrapper)
    const previousHeight = list.viewport.scrollHeight
    button.setAttribute('data-height', '112')
    resizeRow(wrapper, 112)
    await waitFor(() =>
      expect(list.viewport.scrollHeight).toBeGreaterThan(previousHeight),
    )
    list.viewport.scrollTo({ top: list.viewport.scrollHeight })
    expect(list.getByRole('button', { name: 'Item 1999' })).toBeVisible()
  })

  it('keeps a usable range after removal, an empty list, and repopulation', () => {
    const list = renderList()
    list.viewport.scrollTo({ top: list.viewport.scrollHeight })
    const remaining = list.items().slice(0, 2)
    list.setItems(remaining)
    list.viewport.scrollTo({ top: list.viewport.scrollTop })
    expect(list.getAllByRole('button')).toHaveLength(2)
    expect(list.getByRole('button', { name: 'Item 0' })).toBeVisible()
    expect(list.viewport.scrollTop).toBe(0)

    list.setItems([])
    expect(list.queryAllByRole('button')).toHaveLength(0)
    list.setItems(remaining)
    expect(list.getAllByRole('button')).toHaveLength(2)
  })
})
