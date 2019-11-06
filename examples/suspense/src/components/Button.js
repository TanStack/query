import React from "react";

import Spinner from "./Spinner";

export default function Button({ children, timeoutMs = 3000, onClick }) {
  const [startTransition, isPending] = React.useTransition({
    timeoutMs: timeoutMs
  });

  const handleClick = e => {
    startTransition(() => {
      onClick(e);
    });
  };

  return (
    <>
      <button onClick={handleClick} disabled={isPending}>
        {children} {isPending ? <Spinner /> : null}
      </button>
    </>
  );
}
