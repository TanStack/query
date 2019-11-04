import React from 'react'

export default ({ children, ...props }) => {
  return (
    <div>
      <button {...props}>
        {children}
        <style jsx>{`
          button {
            width: 100px;
            height: 40px;
            border: none;
            color: #fff;
            background: #03a9f4;
            font-size: 1rem;
            border-radius: 5px;
          }
        `}</style>
      </button>
    </div>
  )
}
