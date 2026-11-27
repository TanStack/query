export type NotifyCallback = () => void

export type NotifyFunction = (callback: () => void) => void

export type BatchNotifyFunction = (callback: () => void) => void

export type BatchCallsCallback<T extends Array<unknown>> = (...args: T) => void

export type ScheduleFunction = (callback: () => void) => void
