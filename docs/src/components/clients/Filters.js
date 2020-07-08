import React from 'react'
export const Filters = () => (
  <>
    <svg width={0} height={0}>
      <defs>
        <filter id="high-threshold">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0" />
            <feFuncG type="discrete" tableValues="0" />
            <feFuncB type="discrete" tableValues="0" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
    <svg width={0} height={0}>
      <defs>
        <filter id="medium-threshold">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 1" />
            <feFuncG type="discrete" tableValues="0 1" />
            <feFuncB type="discrete" tableValues="0 1" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
    <svg width={0} height={0}>
      <defs>
        <filter id="low-threshold">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0 0 0 1" />
            <feFuncG type="discrete" tableValues="0 0 0 0 1" />
            <feFuncB type="discrete" tableValues="0 0 0 0 1" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  </>
)
