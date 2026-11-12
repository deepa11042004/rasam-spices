"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  /** The full sentence to type in. Rendered in full by default (see note below). */
  text: string;
  className?: string;
  /** Milliseconds between characters. */
  speed?: number;
};

/**
 * A single sentence that types itself in, character by character, with a slim
 * blinking cursor that stills once the line is complete. Starts only when the
 * sentence scrolls into view, and only once per page load.
 *
 * Renders the full sentence by default so the line is always complete with
 * scripting off, for search engines, and for the instant React hydrates --
 * the animation then takes over via a layout effect, before the browser gets
 * a chance to paint, so there is no flash of the finished sentence first.
 * `prefers-reduced-motion` skips the animation entirely and leaves the full
 * sentence in place.
 */
export default function TypingStatement({ text, className = "", speed = 26 }: Props) {
  const [charCount, setCharCount] = useState(text.length);
  const [animate, setAnimate] = useState(false);
  const [done, setDone] = useState(true);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const hasStartedRef = useRef(false);

  // Runs synchronously before the first paint: decide whether to animate at all.
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setCharCount(0);
    setDone(false);
    setAnimate(true);
  }, []);

  // Starts the reveal only once the sentence is actually on screen.
  useEffect(() => {
    if (!animate) return;
    const node = paragraphRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || hasStartedRef.current) return;
        hasStartedRef.current = true;
        observer.disconnect();

        let i = 0;
        const interval = window.setInterval(() => {
          i += 1;
          setCharCount(i);
          if (i >= text.length) {
            window.clearInterval(interval);
            setDone(true);
          }
        }, speed);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [animate, text, speed]);

  return (
    <p ref={paragraphRef} className={className}>
      {text.slice(0, charCount)}
      <span aria-hidden="true" className={`typing-cursor ${done ? "typing-cursor-stop" : ""}`} />
    </p>
  );
}
