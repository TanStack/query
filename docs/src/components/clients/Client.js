import React from 'react'
import { LazyImage } from '../LazyImage'
export const Client = React.memo(({ name, image, style, ...rest }) => (
  <span title={name} {...rest}>
    <LazyImage
      src={image}
      alt={name}
      width={150}
      style={style}
      className="inline"
    />
  </span>
))
