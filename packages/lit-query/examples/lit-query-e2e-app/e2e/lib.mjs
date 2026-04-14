import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { DEMO_PORT } from '../config/port.js'

export const host = '127.0.0.1'
export const port = DEMO_PORT
export const baseUrl = `http://${host}:${port}`

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const projectDir = new URL('..', import.meta.url)
const allowExistingServer = process.env.PW_ALLOW_EXISTING_SERVER === 'true'
const strictPortErrorPattern =
  /(?:EADDRINUSE|Port\s+\d+\s+is (?:already )?in use)/i
const defaultArtifactDir = fileURLToPath(
  new URL('../output/playwright/', import.meta.url),
)
const shouldCaptureFailureArtifacts =
  process.env.PW_CAPTURE_FAILURE_ARTIFACTS !== 'false'
const artifactDir = process.env.PW_ARTIFACT_DIR ?? defaultArtifactDir

function readPositiveIntEnv(name, fallback) {
  const value = process.env[name]
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}="${value}". Expected a positive integer.`)
  }

  return parsed
}

const httpProbeTimeoutMs = readPositiveIntEnv('PW_HTTP_PROBE_TIMEOUT_MS', 800)
const serverReadyTimeoutMs = readPositiveIntEnv(
  'PW_SERVER_READY_TIMEOUT_MS',
  20_000,
)
const textWaitTimeoutMs = readPositiveIntEnv(
  'PW_WAIT_FOR_TEXT_TIMEOUT_MS',
  7_000,
)

function sanitizeForPath(value) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-')
}

async function captureFailureArtifacts(page, error) {
  if (!shouldCaptureFailureArtifacts) {
    return
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const errorName = error instanceof Error ? error.name : 'UnknownError'
  const basename = `${stamp}-${sanitizeForPath(errorName)}`
  const screenshotPath = join(artifactDir, `${basename}.png`)
  const htmlPath = join(artifactDir, `${basename}.html`)

  try {
    await mkdir(artifactDir, { recursive: true })
    await page.screenshot({ path: screenshotPath, fullPage: true })
    await writeFile(htmlPath, await page.content(), 'utf8')
    console.error(`Saved failure screenshot: ${screenshotPath}`)
    console.error(`Saved failure page HTML: ${htmlPath}`)
  } catch (artifactError) {
    console.error('Failed to capture failure artifacts:', artifactError)
  }
}

function startServer() {
  let startupError

  const child = spawn(
    npmCommand,
    [
      'run',
      'dev',
      '--',
      '--host',
      host,
      '--port',
      String(port),
      '--strictPort',
    ],
    {
      cwd: projectDir,
      env: {
        ...process.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  const onLog = (output, chunk) => {
    const text = chunk.toString()
    output.write(`[vite] ${text}`)

    if (strictPortErrorPattern.test(text)) {
      startupError = new Error(
        `Vite could not bind strict port ${port}. Another process is already using ${baseUrl}.`,
      )
    }
  }

  child.stdout.on('data', (chunk) => {
    onLog(process.stdout, chunk)
  })

  child.stderr.on('data', (chunk) => {
    onLog(process.stderr, chunk)
  })

  return {
    child,
    getStartupError: () => startupError,
  }
}

async function isServerReady(url) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, httpProbeTimeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeoutId)
  }
}

async function waitForServer(
  url,
  child,
  getStartupError,
  timeoutMs = serverReadyTimeoutMs,
) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const startupError = getStartupError()
    if (startupError) {
      throw startupError
    }

    if (child.exitCode !== null) {
      throw new Error(
        `Vite exited before server became ready (exit code ${child.exitCode}).`,
      )
    }

    if (await isServerReady(url)) {
      return
    }

    await sleep(200)
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms: ${url}`)
}

export async function ensureServer() {
  if (await isServerReady(baseUrl)) {
    if (!allowExistingServer) {
      throw new Error(
        `Refusing to reuse pre-existing server at ${baseUrl}. Set PW_ALLOW_EXISTING_SERVER=true to allow reuse.`,
      )
    }

    console.log(`Using existing server at ${baseUrl}`)
    return { child: undefined }
  }

  const server = startServer()

  try {
    await waitForServer(baseUrl, server.child, server.getStartupError)
    return { child: server.child }
  } catch (error) {
    if (server.child.exitCode === null) {
      server.child.kill('SIGTERM')
      await Promise.race([once(server.child, 'exit'), sleep(2_000)])
    }

    if (server.child.exitCode === null) {
      server.child.kill('SIGKILL')
      await Promise.race([once(server.child, 'exit'), sleep(2_000)])
    }

    throw error
  }
}

export async function stopServer(serverHandle) {
  const child = serverHandle?.child

  if (!child || child.exitCode !== null) {
    return
  }

  child.kill('SIGTERM')
  await Promise.race([once(child, 'exit'), sleep(2_000)])

  if (child.exitCode === null) {
    child.kill('SIGKILL')
    await Promise.race([once(child, 'exit'), sleep(2_000)])
  }
}

export async function withBrowserPage(runScenario, options = {}) {
  const { assertNoPageErrors = true } = options
  let serverHandle
  let browser
  let page
  const pageErrors = []

  try {
    serverHandle = await ensureServer()
    browser = await chromium.launch({
      headless: process.env.PW_HEADLESS !== 'false',
    })

    const context = await browser.newContext()
    page = await context.newPage()

    page.on('pageerror', (error) => {
      console.error('pageerror:', error.message)
      if (error.stack) {
        console.error(error.stack)
      }
      pageErrors.push(error)
    })

    try {
      await runScenario({
        page,
        context,
        pageErrors,
        baseUrl,
      })

      if (assertNoPageErrors) {
        assert.equal(
          pageErrors.length,
          0,
          'page should not emit runtime errors',
        )
      }
    } catch (error) {
      await captureFailureArtifacts(page, error)
      throw error
    }
  } finally {
    if (browser) {
      await browser.close()
    }
    await stopServer(serverHandle)
  }
}

export async function waitForText(
  page,
  selector,
  expectedText,
  timeout = textWaitTimeoutMs,
) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeout) {
    const currentText = await page.evaluate((currentSelector) => {
      return document.querySelector(currentSelector)?.textContent ?? ''
    }, selector)

    if (currentText.includes(expectedText)) {
      return
    }

    await page.waitForTimeout(100)
  }

  const finalText = await page.evaluate((currentSelector) => {
    return document.querySelector(currentSelector)?.textContent ?? ''
  }, selector)

  throw new Error(
    `Timed out waiting for text "${expectedText}" in "${selector}". Final text: "${finalText}"`,
  )
}

export async function readNumberFromTail(page, selector) {
  const text = await page.locator(selector).innerText()
  const match = text.match(/(\d+)\s*$/)

  if (!match) {
    throw new Error(
      `Unable to parse trailing number from "${selector}": "${text}"`,
    )
  }

  return Number(match[1])
}
