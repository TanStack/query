export type FocusManagerListener = (focused: boolean) => void

export type FocusManagerSetupFn = (
  setFocused: (focused?: boolean) => void,
) => (() => void) | undefined
