'use client';
import { useEffect, useState } from 'react';

/** A small "back to top" button that appears after scrolling. */
export function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 700);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <button className="scroll-top" data-show={show} aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      ↑
    </button>
  );
}
