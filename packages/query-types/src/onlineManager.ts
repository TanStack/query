export type OnlineManagerListener = (online: boolean) => void

export type OnlineManagerSetupFn = (
  setOnline: OnlineManagerListener,
) => (() => void) | undefined
