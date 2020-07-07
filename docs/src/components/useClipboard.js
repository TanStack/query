import * as React from 'react';
import copy from 'copy-to-clipboard';
/**
 * React hook to copy content to clipboard
 *
 * @param text the text or value to copy
 * @param timeout delay (in ms) to switch back to initial state once copied.
 */

export function useClipboard(text, timeout = 1500) {
  const [hasCopied, setHasCopied] = React.useState(false);
  const onCopy = React.useCallback(() => {
    const didCopy = copy(text);
    setHasCopied(didCopy);
  }, [text]); // @ts-ignore

  React.useEffect(() => {
    if (hasCopied) {
      const id = setTimeout(() => {
        setHasCopied(false);
      }, timeout);
      return () => clearTimeout(id);
    }
  }, [timeout, hasCopied]);
  return [hasCopied, onCopy];
}