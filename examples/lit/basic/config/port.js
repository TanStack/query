const DEFAULT_DEMO_PORT = 4173
const envPort = process.env.DEMO_PORT

function resolvePort() {
  if (!envPort) {
    return DEFAULT_DEMO_PORT
  }

  const parsedPort = Number.parseInt(envPort, 10)
  const isValidPort =
    Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535

  if (!isValidPort) {
    throw new Error(
      `Invalid DEMO_PORT "${envPort}". Expected an integer between 1 and 65535.`,
    )
  }

  return parsedPort
}

export const DEMO_PORT = resolvePort()
