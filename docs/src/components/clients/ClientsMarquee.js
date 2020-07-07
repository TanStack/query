import React from 'react'
import { Client } from './Client'
import { users } from 'users'
const pinnedLogos = users.filter(p => p.pinned)
export const ClientsMarquee = React.memo(props => {
  return (
    <div className="overflow-x-hidden">
      <div className="relative translate-x-1/2" {...props}>
        <div className="wrapper inline-block">
          {pinnedLogos.map(({ caption, infoLink, image, style }) => (
            <Client
              className="mx-8 align-middle opacity-50"
              key={caption}
              style={style}
              name={caption}
              image={image}
            />
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
            filter: grayscale(100%);
          }
        `}</style>
      </div>
    </div>
  )
})
ClientsMarquee.displayName = 'ClientsMarquee'
