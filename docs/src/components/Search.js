import * as React from 'react'
import { useSearch } from './useSearch'

export const Search = () => {
  const { onOpen } = useSearch()

  return (
    <div>
      <button
        type="button"
        className="group form-input hover:text-gray-600 hover:border-gray-300 transition duration-150 ease-in-out pointer flex items-center bg-gray-50 text-left w-full  text-gray-500 rounded-lg text-sm align-middle"
        onClick={onOpen}
      >
        <svg
          width="1em"
          height="1em"
          className="mr-3 align-middle text-gray-600 flex-shrink-0 group-hover:text-gray-700"
          style={{
            marginBottom: 2,
          }}
          viewBox="0 0 20 20"
        >
          <path
            d="M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z"
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            fillRule="evenodd"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
        Search docs
        <span className="ml-auto invisible lg:visible">
          <kbd
            className="border border-gray-300 mr-1 bg-gray-100 align-middle p-0 inline-flex justify-center items-center  text-xs text-center mr-0 rounded group-hover:border-gray-300 transition duration-150 ease-in-out "
            style={{
              minWidth: '1.8em',
            }}
          >
            ⌘
          </kbd>
          <kbd
            className="border border-gray-300 bg-gray-100 align-middle p-0 inline-flex justify-center items-center  text-xs text-center ml-auto mr-0 rounded group-hover:border-gray-300 transition duration-150 ease-in-out "
            style={{
              minWidth: '1.8em',
            }}
          >
            K
          </kbd>
        </span>
      </button>
    </div>
  )
}
Search.displayName = 'Search'
