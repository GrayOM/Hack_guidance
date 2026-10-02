import { useEffect, useRef, useState } from "react";
import "./terminal-motion.css";

/**
 * The console behaviour the operation screens established: lines that type, text that resolves out
 * of noise, a meter that never settles. The landing page needs the same vocabulary, so it lives
 * here rather than inside one page, and both read from one implementation.
 */

const noiseAlphabet = "0123456789ABCDEF#$%&*/<>?@\\^|~";
export const noiseChar = () => noiseAlphabet[Math.floor(Math.random() * noiseAlphabet.length)];
export const noiseRun = (length: number) => Array.from({ length }, noiseChar).join("");

/**
 * Types a log a character at a time.
 *
 * A burst usually repeats the lines already on screen before adding its own, so whatever matches
 * what is already typed is kept and only the tail is typed. Without that, every call would retype
 * the whole session from the top.
 */
export function useTypedLog(lines: string[], speed = 14) {
  const [view, setView] = useState<string[]>([]);
  const settled = useRef<string[]>([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!lines.length) {
      settled.current = [];
      setView([]);
      setTyping(false);
      return;
    }
    let shared = 0;
    while (shared < settled.current.length && shared < lines.length && settled.current[shared] === lines[shared]) shared += 1;
    const base = lines.slice(0, shared);
    settled.current = base;
    setView(base);
    if (shared >= lines.length) {
      setTyping(false);
      return;
    }
    setTyping(true);
    let row = shared;
    let column = 0;
    const timer = window.setInterval(() => {
      column += 1;
      const next = [...lines.slice(0, row), lines[row].slice(0, column)];
      settled.current = next;
      setView(next);
      if (column >= lines[row].length) {
        row += 1;
        column = 0;
      }
      if (row >= lines.length) {
        window.clearInterval(timer);
        setTyping(false);
      }
    }, speed);
    return () => window.clearInterval(timer);
  }, [lines, speed]);

  return { view, typing };
}

/** Resolves a string out of noise one character at a time. */
export function ScrambleText({ value, className, speed = 34 }: { value: string; className?: string; speed?: number }) {
  const [shown, setShown] = useState(() => noiseRun(value.length));
  useEffect(() => {
    let resolved = 0;
    const timer = window.setInterval(() => {
      resolved += 1;
      if (resolved >= value.length) {
        window.clearInterval(timer);
        setShown(value);
        return;
      }
      setShown(value.slice(0, resolved) + noiseRun(value.length - resolved));
    }, speed);
    return () => window.clearInterval(timer);
  }, [value, speed]);
  return <span className={className}>{shown}</span>;
}

/** A link that is up is a link that is doing something, so the meter never stops. */
export function SignalBars({ active, count = 16 }: { active?: boolean; count?: number }) {
  return <span className={`bt-telemetry__signal${active ? " is-active" : ""}`} aria-hidden="true">
    {Array.from({ length: count }, (_, index) => <i key={index} style={{ animationDelay: `${index * 90}ms` }} />)}
  </span>;
}
