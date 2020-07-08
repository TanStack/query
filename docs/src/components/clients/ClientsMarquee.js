import React from 'react'
import { users } from 'users'

// const pinnedLogos = users.filter(p => p.pinned)

export const ClientsMarquee = React.memo(props => {
  return (
    <div className="overflow-x-hidden">
      <div className="relative translate-x-1/2" {...props}>
        <div className="wrapper inline-block">
          {[...users, ...users, ...users].map((user, i) => (
            <span
              key={user + i}
              className={`text-gray-300 inline-block text-2xl font-black m-1 ${
                i % 2 && 'text-gray-400'
              }`}
            >
              {user}
            </span>
          ))}
        </div>

        <style jsx global>{`
          @keyframes slidein {
            from {
              transform: translate3d(0, 0, 0);
            }

            to {
              transform: translate3d(-50%, 0, 0);
            }
          }
          .wrapper {
            position: relative;
            white-space: nowrap;
            display: inline-block;
            animation: slidein 100s linear infinite;
          }
        `}</style>
      </div>
    </div>
  )
})
ClientsMarquee.displayName = 'ClientsMarquee'
