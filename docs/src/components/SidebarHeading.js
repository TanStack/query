import * as React from 'react';
export const SidebarHeading = ({
  title,
  children
}) => {
  return (// <div>
    //   <h4 className="font-semibold uppercase text-sm my-4">{title}</h4>
    //   <div>{children}</div>
    // </div>
    <div className="heading">
      <h4>{title}</h4>
      <div>{children}</div>
      <style jsx>{`
        h4 {
          margin: 1.25rem 0;
          font-size: 1.2rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
SidebarHeading.displayName = 'SidebarHeading';