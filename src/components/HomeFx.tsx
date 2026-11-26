'use client';
import { useEffect, useRef, useState } from 'react';

/** A word in the headline that swaps every couple of seconds. */
export function RotatingWord({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % words.length), 2400);
    return () => clearInterval(t);
  }, [words.length]);
  return <span key={i} className="gradient-text rot-word">{words[i]}</span>;
}

/** Counts up from 0 to `to` the first time it scrolls into view. */
export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(to);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 1300);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setN(0);
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

/** A fake terminal line that types itself out in a loop. */
export function Typer({ text }: { text: string }) {
  const [n, setN] = useState(text.length);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0, dir = 1, wait = 0;
    setN(0);
    const t = setInterval(() => {
      if (wait > 0) { wait--; return; }
      i += dir;
      setN(i);
      if (i >= text.length) { dir = -1; wait = 22; }
      else if (i <= 0) { dir = 1; wait = 6; }
    }, 70);
    return () => clearInterval(t);
  }, [text]);
  return <span>{text.slice(0, n)}<span className="caret">▍</span></span>;
}
