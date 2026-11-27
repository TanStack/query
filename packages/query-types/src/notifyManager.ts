type NotifyCallback = () => void

type NotifyFunction = (callback: () => void) => void

type BatchNotifyFunction = (callback: () => void) => void

type BatchCallsCallback<T extends Array<unknown>> = (...args: T) => void

type ScheduleFunction = (callback: () => void) => void

export type {
  NotifyCallback,
  NotifyFunction,
  BatchNotifyFunction,
  BatchCallsCallback,
  ScheduleFunction,
}
