import React, { useEffect, useRef, useState } from 'react';

/** Counts smoothly from the previous value to the new one. */
const AnimatedNumber = ({ value, duration = 450, prefix = '' }) => {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const from = shownRef.current;
    if (from === target) return undefined;

    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      shownRef.current = target;
      setDisplay(target);
      return undefined;
    }

    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      shownRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return (
    <>
      {prefix}
      {Math.round(display).toLocaleString('en-IN')}
    </>
  );
};

export default AnimatedNumber;
