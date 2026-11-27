type OnlineManagerListener = (online: boolean) => void

type OnlineManagerSetupFn = (
  setOnline: OnlineManagerListener,
) => (() => void) | undefined

export type { OnlineManagerListener, OnlineManagerSetupFn }
