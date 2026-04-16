import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { API_PORT, DEMO_PORT } from '../config/ports.js'

export const host = '127.0.0.1'
export const apiUrl = `http://${host}:${API_PORT}`
export const baseUrl = `http://${host}:${DEMO_PORT}`

const packageManagerCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
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

function startProcess(name, args, extraEnv = {}) {
  let startupError

  const child = spawn(packageManagerCommand, args, {
    cwd: projectDir,
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const onLog = (output, chunk) => {
    const text = chunk.toString()
    output.write(`[${name}] ${text}`)

    if (strictPortErrorPattern.test(text)) {
      startupError = new Error(
        `${name} failed to bind a strict port. Check for conflicting servers.`,
      )
    }
  }

  child.stdout.on('data', (chunk) => onLog(process.stdout, chunk))
  child.stderr.on('data', (chunk) => onLog(process.stderr, chunk))

  return {
    child,
    getStartupError: () => startupError,
  }
}

async function isServerReady(url) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), httpProbeTimeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })
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
        `Process exited before server became ready (exit code ${child.exitCode}).`,
      )
    }

    if (await isServerReady(url)) {
      return
    }

    await sleep(200)
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms: ${url}`)
}

async function stopProcess(processHandle) {
  const child = processHandle?.child

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

async function ensureServers() {
  const existingApiReady = await isServerReady(`${apiUrl}/api/projects?page=1`)
  const existingWebReady = await isServerReady(baseUrl)

  if (existingApiReady || existingWebReady) {
    if (!allowExistingServer) {
      throw new Error(
        `Refusing to reuse existing server(s) at ${baseUrl} / ${apiUrl}. Set PW_ALLOW_EXISTING_SERVER=true to allow reuse.`,
      )
    }

    console.log(`Using existing servers at ${baseUrl} and ${apiUrl}`)
    return { api: undefined, web: undefined }
  }

  const api = startProcess('api', ['run', 'dev:api'])

  try {
    await waitForServer(
      `${apiUrl}/api/projects?page=1`,
      api.child,
      api.getStartupError,
    )
  } catch (error) {
    await stopProcess(api)
    throw error
  }

  const web = startProcess('web', ['run', 'dev:web'], {
    VITE_PAGINATION_API_PORT: String(API_PORT),
  })

  try {
    await waitForServer(baseUrl, web.child, web.getStartupError)
  } catch (error) {
    await stopProcess(web)
    await stopProcess(api)
    throw error
  }

  return { api, web }
}

export async function withBrowserPage(runScenario, options = {}) {
  const { assertNoPageErrors = true } = options
  let servers
  let browser
  let page
  const pageErrors = []

  try {
    servers = await ensureServers()
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

    await stopProcess(servers?.web)
    await stopProcess(servers?.api)
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
    const currentText = await page
      .locator(selector)
      .textContent({ timeout: 500 })
      .then((value) => value ?? '')
      .catch(() => '')

    if (currentText.includes(expectedText)) {
      return
    }

    await page.waitForTimeout(100)
  }

  const finalText = await page
    .locator(selector)
    .textContent({ timeout: 500 })
    .then((value) => value ?? '')
    .catch(() => '')

  throw new Error(
    `Timed out waiting for text "${expectedText}" in "${selector}". Final text: "${finalText}"`,
  )
}

export async function waitForNthText(
  page,
  selector,
  index,
  expectedText,
  timeout = textWaitTimeoutMs,
) {
  const startedAt = Date.now()
  const locator = page.locator(selector).nth(index)

  while (Date.now() - startedAt < timeout) {
    const currentText = await locator
      .textContent({ timeout: 500 })
      .then((value) => value ?? '')
      .catch(() => '')

    if (currentText.includes(expectedText)) {
      return
    }

    await page.waitForTimeout(100)
  }

  const finalText = await locator
    .textContent({ timeout: 500 })
    .then((value) => value ?? '')
    .catch(() => '')

  throw new Error(
    `Timed out waiting for text "${expectedText}" in "${selector}" at index ${index}. Final text: "${finalText}"`,
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
