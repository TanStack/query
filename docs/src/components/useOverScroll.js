import * as React from 'react';
import { useViewportScroll, useTransform } from 'framer-motion';
import { throttle } from './utils/throttle';

const throttleFn = cb => throttle(cb, 100);

export const useOverScroll = () => {
  const {
    scrollY
  } = useViewportScroll();
  const ref = React.useRef(null);
  const refInner = React.useRef(null);
  const [height, setHeight] = React.useState(typeof window !== 'undefined' ? window.innerHeight : 0);
  const [rect, setRect] = React.useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0
  });
  const [rectInner, setRectInner] = React.useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0
  });
  const y = useTransform(scrollY, [rect.bottom - height, rect.top + 300], [0, -rectInner.height + rect.height]);
  React.useEffect(() => {
    if (ref.current) {
      setRect(ref.current.getBoundingClientRect());
    }
  }, [setRect, ref]);
  React.useEffect(() => {
    if (refInner.current) {
      setRectInner(refInner.current.getBoundingClientRect());
    }
  }, [setRectInner, refInner]);
  return {
    ref,
    refInner,
    y
  };
};