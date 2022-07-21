import { computeObserverCountBoxes, computeQueryBoxes } from './utils'

describe('computeQueryBoxes', () => {
  it('computes query box with added event', () => {
    const boxes = computeQueryBoxes(
      {
        queryHash: 'query',
        events: [
          {
            targetType: 'query',
            eventType: 'added',
            receivedAt: new Date('2022-07-20T13:19:15.000Z'),
            queryHash: 'query',
            actionType: null,
            cacheTime: 300000,
            observersCount: 0,
          },
        ],
        observers: [],
      },
      {
        start: new Date('2022-07-20T13:19:00.000Z'),
        end: new Date('2022-07-20T13:19:59.999Z'),
      },
    )
    expect(boxes).toHaveLength(1)
    expect(boxes[0]).toEqual(
      expect.objectContaining({
        startAt: new Date('2022-07-20T13:19:15.000Z'),
        endAt: new Date('2022-07-20T13:19:59.999Z'),
      }),
    )
  })

  it('computes query box with removed event', () => {
    const boxes = computeQueryBoxes(
      {
        queryHash: 'query',
        events: [
          {
            targetType: 'query',
            eventType: 'removed',
            receivedAt: new Date('2022-07-20T13:19:15.000Z'),
            queryHash: 'query',
            actionType: null,
            cacheTime: 300000,
            observersCount: 0,
          },
        ],
        observers: [],
      },
      {
        start: new Date('2022-07-20T13:19:00.000Z'),
        end: new Date('2022-07-20T13:19:59.999Z'),
      },
    )
    expect(boxes).toHaveLength(1)
    expect(boxes[0]).toEqual(
      expect.objectContaining({
        startAt: new Date('2022-07-20T13:19:00.000Z'),
        endAt: new Date('2022-07-20T13:19:15.000Z'),
      }),
    )
  })
  it('computes query box with updated event', () => {
    const boxes = computeQueryBoxes(
      {
        queryHash: 'query',
        events: [
          {
            targetType: 'query',
            eventType: 'updated',
            receivedAt: new Date('2022-07-20T13:19:15.000Z'),
            queryHash: 'query',
            actionType: null,
            cacheTime: 300000,
            observersCount: 0,
          },
        ],
        observers: [],
      },
      {
        start: new Date('2022-07-20T13:19:00.000Z'),
        end: new Date('2022-07-20T13:19:59.999Z'),
      },
    )

    expect(boxes).toHaveLength(1)
    expect(boxes[0]).toEqual(
      expect.objectContaining({
        startAt: new Date('2022-07-20T13:19:00.000Z'),
        endAt: new Date('2022-07-20T13:19:59.999Z'),
      }),
    )
  })
})

const box: Parameters<typeof computeObserverCountBoxes>[0] = {
  startAt: new Date('2022-07-20T13:59:55.656Z'),
  initialObserversCount: 0,
  updates: [
    {
      at: new Date('2022-07-20T13:59:55.663Z'),
      action: 'fetch',
    },
    {
      at: new Date('2022-07-20T13:59:55.698Z'),
      action: 'success',
    },
  ],
  endAt: new Date('2022-07-20T13:59:59.400Z'),
  observers: [
    {
      targetType: 'observer',
      observersCount: 0,
      eventType: 'observerResultsUpdated',
      receivedAt: new Date('2022-07-20T13:59:55.659Z'),
      queryHash: '["episodes"]',
    },
    {
      targetType: 'observer',
      observersCount: 1,
      eventType: 'observerAdded',
      receivedAt: new Date('2022-07-20T13:59:55.663Z'),
      queryHash: '["episodes"]',
    },
    {
      targetType: 'observer',
      observersCount: 1,
      eventType: 'observerResultsUpdated',
      receivedAt: new Date('2022-07-20T13:59:55.698Z'),
      queryHash: '["episodes"]',
    },
  ],
}

describe('computeObserverCountBoxes', () => {
  it('computes a box as soon as a query is added', () => {
    const boxes = computeObserverCountBoxes(box)
    expect(boxes).toEqual([
      {
        start: new Date('2022-07-20T13:59:55.663Z'),
        end: new Date('2022-07-20T13:59:59.400Z'),
        count: 1,
      },
    ])
  })
})
