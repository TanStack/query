import * as React from 'react';
import cn from 'classnames';
export const Sticky = ({
  offset,
  children,
  shadow
}) => {
  return <div style={{
    top: offset || 0
  }} className={cn({
    shadow
  }, 'z-10')}>
      {children}

      <style jsx>{`
        div {
          background: #fff;
          position: sticky;
        }
        div.shadow {
          box-shadow: rgba(0, 0, 0, 0.06) 0px 6px 20px;
        }
      `}</style>
    </div>;
};
Sticky.displayName = 'Sticky';