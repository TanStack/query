import { Key } from '@solid-primitives/keyed'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { createEffect, createMemo, on, onCleanup } from 'solid-js'
import type { VirtualItem } from '@tanstack/solid-virtual'
import type { Accessor, JSX } from 'solid-js'

type VirtualListProps<T> = {
  each: ReadonlyArray<T>
  getKey: (item: T) => VirtualItem['key']
  class: string
  contentClass: string
  children: (item: Accessor<T>) => JSX.Element
}

type VisibleRow<T> = {
  item: T
  key: VirtualItem['key']
  index: number
  start: number
}

/**
 * Renders measured rows for the visible portion of an ordered list.
 * @param props - The items, stable keys, classes, and row content.
 * @returns The scroll viewport and its visible rows.
 */
export function VirtualList<T>(props: VirtualListProps<T>): JSX.Element {
  let scrollElement!: HTMLDivElement
  const keyForIndex = createMemo(() => {
    const keys = props.each.map(props.getKey)
    return (index: number) => keys[index] ?? index
  })
  const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
    get count() {
      return props.each.length
    },
    getScrollElement: () => scrollElement,
    get getItemKey() {
      return keyForIndex()
    },
    estimateSize: () => 28,
    overscan: 5,
    useAnimationFrameWithResizeObserver: true,
  })
  const rows = createMemo(() => {
    const items = props.each
    const visible: Array<VisibleRow<T>> = []
    for (const entry of virtualizer.getVirtualItems()) {
      const item = items[entry.index]
      if (item !== undefined) {
        visible.push({
          item,
          key: props.getKey(item),
          index: entry.index,
          start: entry.start,
        })
      }
    }
    return visible
  })

  return (
    <div ref={scrollElement} class={props.class}>
      <div
        class={props.contentClass}
        style={{
          position: 'relative',
          width: '100%',
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        <Key each={rows()} by={(row) => row.key}>
          {(row) => {
            let element!: HTMLDivElement
            createEffect(
              on(
                () => row().index,
                (index) => {
                  element.setAttribute('data-index', String(index))
                  virtualizer.measureElement(element)
                },
              ),
            )
            onCleanup(() => virtualizer.measureElement(null))
            return (
              <div
                ref={element}
                data-index={row().index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${row().start}px)`,
                }}
              >
                {props.children(() => row().item)}
              </div>
            )
          }}
        </Key>
      </div>
    </div>
  )
}
