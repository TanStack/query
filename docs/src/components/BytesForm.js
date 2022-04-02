import React from 'react'
import useBytesSubmit from './useBytesSubmit'

export default function BytesForm() {
  const { state, handleSubmit, error } = useBytesSubmit()
  if (state === 'submitted') {
    return (
      <p>Success! Please, check your email to confirm your subscription.</p>
    )
  }
  return (
    <form onSubmit={handleSubmit}>
      <div data-element="fields" className="grid relative">
        <figure
          className="absolute right-0"
          style={{ bottom: '72px', right: '-10px' }}
        >
          <img
            height={40}
            width={40}
            src="/images/bytes-logo.png"
            alt="Bytes"
          />
        </figure>
        <input
          className="border rounded p-2 mb-2 w-full"
          name="email_address"
          placeholder="Your email address"
          type="email"
          required=""
        />
        <button
          type="submit"
          className="mb-4 border rounded bg-coral border-none text-white p-2"
        >
          {state !== 'loading' ? (
            <span>Subscribe</span>
          ) : (
            <span>Loading...</span>
          )}
        </button>
      </div>
      <p className="text-gray-400 text-xs">
        No spam. Unsubscribe at <em>any</em> time.
      </p>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  )
}
