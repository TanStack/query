// mock login and logout

export function login() {
  document.cookie = 'swr-test-token=swr;'
}

export function logout() {
  document.cookie = 'swr-test-token=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
}
