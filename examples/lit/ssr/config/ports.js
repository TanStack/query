const DEFAULT_SSR_HOST = '127.0.0.1'
const DEFAULT_SSR_PORT = 4174

function normalizeUrlHost(host) {
  if (host.includes(':') && !host.startsWith('[') && !host.endsWith(']')) {
    return `[${host}]`
  }

  return host
}

function resolvePort(name, fallback) {
  const value = process.env[name]
  if (!value) {
    return fallback
  }

  const parsedPort = Number.parseInt(value, 10)
  const isValidPort =
    Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65_535

  if (!isValidPort) {
    throw new Error(
      `Invalid ${name} "${value}". Expected an integer between 1 and 65535.`,
    )
  }

  return parsedPort
}

export const SSR_PORT = resolvePort('SSR_PORT', DEFAULT_SSR_PORT)
export const SSR_HOST = process.env.SSR_HOST ?? DEFAULT_SSR_HOST

function resolveConnectHost(host) {
  if (host === '0.0.0.0') {
    return '127.0.0.1'
  }

  if (host === '::') {
    return '[::1]'
  }

  return normalizeUrlHost(host)
}

function resolvePublicOrigin(host, port) {
  const explicitOrigin = process.env.SSR_PUBLIC_ORIGIN
  if (explicitOrigin) {
    const url = new URL(explicitOrigin)
    return url.origin
  }

  const explicitPublicHost = process.env.SSR_PUBLIC_HOST
  const publicHost = explicitPublicHost
    ? normalizeUrlHost(explicitPublicHost)
    : resolveConnectHost(host)

  return `http://${publicHost}:${port}`
}

export const SSR_CONNECT_HOST = resolveConnectHost(SSR_HOST)
export const SSR_BASE_URL = `http://${SSR_CONNECT_HOST}:${SSR_PORT}`
export const SSR_PUBLIC_ORIGIN = resolvePublicOrigin(SSR_HOST, SSR_PORT)
