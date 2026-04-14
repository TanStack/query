import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { SSR_BASE_URL } from '../config/ports.js'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const cwd = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const allowExistingServer = process.env.PW_ALLOW_EXISTING_SERVER === 'true'
const strictPortErrorPattern =
  /(?:EADDRINUSE|Port\s+\d+\s+is (?:already )?in use)/i
const artifactDir = fileURLToPath(
  new URL('../output/playwright/', import.meta.url),
)
const httpProbeTimeoutMs = 800
const serverReadyTimeoutMs = 20_000
const selectorTimeoutMs = 10_000

export const baseUrl = SSR_BASE_URL

export function runBuild() {
  const result = spawnSync(npmCommand, ['run', 'build'], {
    cwd,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error(`Example build failed with exit code ${result.status}.`)
  }
}

function startServer() {
  let startupError

  const child = spawn(npmCommand, ['run', 'dev:server'], {
    cwd,
    env: {
      ...process.env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const onLog = (output, chunk) => {
    const text = chunk.toString()
    output.write(`[server] ${text}`)

    if (strictPortErrorPattern.test(text)) {
      startupError = new Error(
        `SSR server could not bind ${baseUrl}. Another process is already using that address.`,
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
        `SSR server exited before becoming ready (exit code ${child.exitCode}).`,
      )
    }

    if (await isServerReady(url)) {
      return
    }

    await sleep(200)
  }

  throw new Error(`SSR server did not become ready within ${timeoutMs}ms.`)
}

export async function ensureServer() {
  if (await isServerReady(`${baseUrl}/api/request-count`)) {
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
    await waitForServer(
      `${baseUrl}/api/request-count`,
      server.child,
      server.getStartupError,
    )
    return server
  } catch (error) {
    await stopServer(server)
    throw error
  }
}

async function assertOkResponse(response, method, pathname) {
  assert.equal(
    response.status,
    200,
    `${method} ${pathname} should return HTTP 200`,
  )
}

export async function resetTestState() {
  const response = await fetch(`${baseUrl}/api/reset`, { method: 'POST' })
  await assertOkResponse(response, 'POST', '/api/reset')
}

export async function getRequestCount() {
  const response = await fetch(`${baseUrl}/api/request-count`)
  await assertOkResponse(response, 'GET', '/api/request-count')
  const payload = await response.json()
  return payload.count
}

export async function armNextDataError() {
  const response = await fetch(`${baseUrl}/api/test/fail-next-data`, {
    method: 'POST',
  })
  await assertOkResponse(response, 'POST', '/api/test/fail-next-data')
}

export async function armNextDataDelay(delayMs) {
  const response = await fetch(
    `${baseUrl}/api/test/delay-next-data?ms=${delayMs}`,
    {
      method: 'POST',
    },
  )
  await assertOkResponse(response, 'POST', '/api/test/delay-next-data')
}

export async function waitForText(
  page,
  selector,
  expectedText,
  timeoutMs = selectorTimeoutMs,
) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const text = await page
      .locator(selector)
      .textContent()
      .catch(() => null)
    if (text?.includes(expectedText)) {
      return
    }

    await sleep(200)
  }

  throw new Error(
    `Timed out waiting for ${selector} to include "${expectedText}".`,
  )
}

export async function waitForDisabledState(
  page,
  selector,
  expectedDisabled,
  timeoutMs = selectorTimeoutMs,
) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const actual = await page
      .locator(selector)
      .isDisabled()
      .catch(() => null)
    if (actual === expectedDisabled) {
      return
    }

    await sleep(100)
  }

  throw new Error(
    `Timed out waiting for ${selector} disabled=${expectedDisabled}.`,
  )
}

async function captureFailureArtifacts(page) {
  if (!page) {
    return
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const screenshotPath = join(artifactDir, `${timestamp}-ssr-e2e.png`)
  const htmlPath = join(artifactDir, `${timestamp}-ssr-e2e.html`)

  await mkdir(artifactDir, { recursive: true })
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await writeFile(htmlPath, await page.content(), 'utf8')

  console.error(`Saved failure screenshot: ${screenshotPath}`)
  console.error(`Saved failure page HTML: ${htmlPath}`)
}

export async function withBrowserPage(runScenario, options = {}) {
  const {
    allowedConsoleIssuePatterns = [],
    assertNoConsoleIssues = true,
    assertNoPageErrors = true,
  } = options

  console.log('Step 1: build the SSR example client bundle')
  runBuild()

  console.log('Step 2: start the SSR server')
  const server = await ensureServer()

  let browser
  let page
  const consoleIssues = []
  const pageErrors = []

  try {
    browser = await chromium.launch({
      headless: process.env.PW_HEADLESS !== 'false',
    })
    page = await browser.newPage()

    page.on('console', (message) => {
      const text = message.text()
      if (message.type() === 'error' || /(hydrat|mismatch)/i.test(text)) {
        consoleIssues.push(`[${message.type()}] ${text}`)
      }
    })

    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    await runScenario({
      page,
      baseUrl,
      consoleIssues,
      pageErrors,
    })

    if (assertNoPageErrors) {
      assert.deepEqual(pageErrors, [])
    }

    if (assertNoConsoleIssues) {
      const unexpectedConsoleIssues = consoleIssues.filter(
        (issue) =>
          !allowedConsoleIssuePatterns.some((pattern) => pattern.test(issue)),
      )
      assert.deepEqual(unexpectedConsoleIssues, [])
    }
  } catch (error) {
    await captureFailureArtifacts(page)
    throw error
  } finally {
    await browser?.close()
    await stopServer(server)
  }
}
