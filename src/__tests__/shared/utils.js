export function sleep(timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timeout)
  })
}
