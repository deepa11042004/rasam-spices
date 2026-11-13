"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  /** The full sentence to type in. Rendered in full by default (see note below). */
  text: string;
  className?: string;
  /** Base milliseconds between characters (actual pace varies a little -- see below). */
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
export default function TypingStatement({ text, className = "", speed = 120 }: Props) {
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

  // Starts the reveal only once the sentence is actually on screen. The pace
  // between letters varies a little (and lingers briefly after a comma or
  // full stop), so it reads like someone actually writing the line rather
  // than a metronome.
  useEffect(() => {
    if (!animate) return;
    const node = paragraphRef.current;
    if (!node) return;

    let timeoutId: number | undefined;

    const typeNext = (i: number) => {
      setCharCount(i);
      if (i >= text.length) {
        setDone(true);
        return;
      }
      const justTyped = text[i - 1];
      const pause =
        justTyped === "," ? speed * 1.5 : justTyped === "." ? speed * 2.5 : 0;
      // Small jitter (up to ~30% of base) keeps the pace in the 120-140ms
      // band on average without reading as mechanical.
      const jitter = speed * 0.3 * Math.random();
      timeoutId = window.setTimeout(() => typeNext(i + 1), speed + jitter + pause);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || hasStartedRef.current) return;
        hasStartedRef.current = true;
        observer.disconnect();
        timeoutId = window.setTimeout(() => typeNext(1), speed);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [animate, text, speed]);

  return (
    <p ref={paragraphRef} className={className}>
      {text.slice(0, charCount)}
      <span aria-hidden="true" className={`typing-cursor ${done ? "typing-cursor-stop" : ""}`} />
    </p>
  );
}
