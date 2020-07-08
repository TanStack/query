import * as React from 'react';
import cn from 'classnames';
export const Container = props => {
  return <div className={cn('container mx-auto')} {...props} />;
};
Container.displayName = 'Container';