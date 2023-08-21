import { act, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'

import { CopyButton, DefaultRenderer, chunkArray } from '../Explorer'
import { displayValue } from '../utils'

describe('Explorer', () => {
  describe('chunkArray', () => {
    it('when the size is less than one return an empty array', () => {
      expect(chunkArray([1, 2, 3], 0)).toStrictEqual([])
    })

    it('when the array is empty return an empty array', () => {
      expect(chunkArray([], 2)).toStrictEqual([])
    })

    it('when the array is evenly chunked return full chunks ', () => {
      expect(chunkArray([1, 2, 3, 4], 2)).toStrictEqual([
        [1, 2],
        [3, 4],
      ])
    })

    it('when the array is not evenly chunkable by size the last item is the remaining elements  ', () => {
      const chunks = chunkArray([1, 2, 3, 4, 5], 2)
      const lastChunk = chunks[chunks.length - 1]
      expect(lastChunk).toStrictEqual([5])
    })
  })

  describe('DefaultRenderer', () => {
    it('when the entry label is clicked, toggle expanded', async () => {
      const toggleExpanded = jest.fn()

      render(
        <DefaultRenderer
          label="the top level label"
          toggleExpanded={toggleExpanded}
          pageSize={10}
          expanded={false}
          copyable={false}
          subEntryPages={[[{ label: 'A lovely label' }]]}
          handleEntry={() => <></>}
          value={undefined}
          subEntries={[]}
          type="string"
        />,
      )

      const expandButton = screen.getByRole('button', {
        name: /▶ the top level label 0 item/i,
      })

      fireEvent.click(expandButton)

      expect(toggleExpanded).toHaveBeenCalledTimes(1)
    })

    it('when the copy button is clicked, update the clipboard value', async () => {
      // Mock clipboard
      let clipBoardContent = null
      const value = 'someValue'
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async () => {
            return new Promise(() => (clipBoardContent = value))
          },
        },
        configurable: true,
      })

      act(() => {
        render(<CopyButton value={value} />)
      })

      // After rendering the clipboard content should be null
      expect(clipBoardContent).toBe(null)

      const copyButton = screen.getByRole('button')

      await screen.findByLabelText('Copy object to clipboard')

      // After clicking the content should be added to the clipboard
      await act(async () => {
        fireEvent.click(copyButton)
      })

      expect(clipBoardContent).toBe(value)
      screen.findByLabelText('Object copied to clipboard')
    })

    it('when the copy button is clicked but there is an error, show error state', async () => {
      // Mock clipboard with error state
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async () => {
            return new Promise(() => {
              throw Error
            })
          },
        },
        configurable: true,
      })

      act(() => {
        render(<CopyButton value={'someValue'} />)
      })

      const copyButton = screen.getByRole('button')

      await screen.findByLabelText('Copy object to clipboard')

      // After clicking the content should NOT be added to the clipboard
      await act(async () => {
        fireEvent.click(copyButton)
      })

      // Check that it has failed
      await screen.findByLabelText('Failed copying to clipboard')
    })
  })

  describe('displayValue', () => {
    it('when the value is a boolean', () => {
      expect(displayValue(true)).toBe('true')
    })

    it('when the value is a BigInt', () => {
      expect(displayValue(BigInt(1))).toBe('"1"')
    })

    it('when the value is an Error', () => {
      expect(displayValue(new Error('err'))).toBe(
        '{"name":"Error","message":"err"}',
      )
    })

    it('when the value is an object', () => {
      expect(displayValue({ error: new Error('err'), bigint: 1n })).toBe(
        '{"error":{"name":"Error","message":"err"},"bigint":"1"}',
      )
    })
  })
})
