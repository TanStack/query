import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import {
  createRoot as createOctaneRoot,
  drainPassiveEffects,
  flushSync,
} from 'octane'
import * as React from 'react'
import { act as reactAct } from 'react'
import { createRoot as createReactRoot } from 'react-dom/client'
import type { Root as ReactRoot } from 'react-dom/client'

const directory = dirname(fileURLToPath(import.meta.url))
const cacheDirectory = join(directory, '.react-cache')

;(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

function hashString(value: string): string {
  let hash = 5381
  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash).toString(36)
}

function stripComments(value: string): string {
  let output = ''
  let index = 0
  while (index < value.length) {
    const open = value.indexOf('<!--', index)
    if (open === -1) {
      output += value.slice(index)
      break
    }
    output += value.slice(index, open)
    const close = value.indexOf('-->', open + 4)
    if (close === -1) {
      break
    }
    index = close + 3
  }
  return output
}

function normalizeHtml(value: string): string {
  return stripComments(value).replaceAll('\n', '').replaceAll('\t', '').trim()
}

async function loadReactFixture(
  sourcePath: string,
): Promise<Record<string, unknown>> {
  const slug = basename(sourcePath).replace(/\.tsrx$/, '')
  const outputPath = join(
    cacheDirectory,
    `${slug}-${hashString(sourcePath)}.js`,
  )
  return import(/* @vite-ignore */ outputPath)
}

interface DifferentialMount {
  container: HTMLElement
  click: (selector: string) => Promise<void>
}

interface DifferentialPair {
  step: (
    name: string,
    action: (
      octane: DifferentialMount,
      react: DifferentialMount,
    ) => void | Promise<void>,
  ) => Promise<void>
  unmount: () => void
}

export async function mountDifferential(
  sourcePath: string,
  exportName: string,
): Promise<DifferentialPair> {
  const octaneModule = await import(/* @vite-ignore */ sourcePath)
  const reactModule = await loadReactFixture(sourcePath)
  const OctaneComponent = octaneModule[exportName]
  const ReactComponent = reactModule[exportName]

  if (typeof OctaneComponent !== 'function') {
    throw new Error(`Octane export ${exportName} was not found`)
  }
  if (typeof ReactComponent !== 'function') {
    throw new Error(`React export ${exportName} was not found`)
  }

  const octaneContainer = document.createElement('div')
  const reactContainer = document.createElement('div')
  document.body.append(octaneContainer, reactContainer)

  const octaneRoot = createOctaneRoot(octaneContainer)
  octaneRoot.render(OctaneComponent)
  flushSync(() => {})

  const reactRoot: ReactRoot = createReactRoot(reactContainer)
  await reactAct(async () => {
    reactRoot.render(React.createElement(ReactComponent))
  })

  function createMount(
    container: HTMLElement,
    react: boolean,
  ): DifferentialMount {
    return {
      container,
      async click(selector) {
        let element = container.querySelector(selector)
        if (!element && selector.startsWith('#')) {
          const id = selector.slice(1)
          element =
            Array.from(container.getElementsByTagName('*')).find(
              (candidate) => candidate.id === id,
            ) ?? null
        }
        if (!(element instanceof HTMLElement)) {
          throw new Error(`No element matches ${selector}`)
        }
        if (react) {
          await reactAct(async () => element.click())
        } else {
          flushSync(() => element.click())
        }
      },
    }
  }

  const octane = createMount(octaneContainer, false)
  const react = createMount(reactContainer, true)

  return {
    async step(name, action) {
      await action(octane, react)
      drainPassiveEffects()
      await reactAct(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      const octaneHtml = normalizeHtml(octaneContainer.innerHTML)
      const reactHtml = normalizeHtml(reactContainer.innerHTML)
      expect(octaneHtml, `Differential DOM divergence at ${name}`).toBe(
        reactHtml,
      )
    },
    unmount() {
      octaneRoot.unmount()
      reactAct(() => reactRoot.unmount())
      octaneContainer.remove()
      reactContainer.remove()
    },
  }
}
