type FocusManagerListener = (focused: boolean) => void

type FocusManagerSetupFn = (
  setFocused: (focused?: boolean) => void,
) => (() => void) | undefined

export type { FocusManagerListener, FocusManagerSetupFn }
