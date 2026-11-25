"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

/**
 * The RASAM wordmark in the header: a normal Link to "/" from any other route (standard Next.js
 * client-side navigation, no page reload), but when the visitor is already on "/" and has scrolled
 * down the page, clicking it smoothly scrolls them back up to the Hero section at the top instead
 * of appearing to do nothing. Respects prefers-reduced-motion. Modifier-key clicks (open in new
 * tab, etc.) and non-primary mouse buttons fall through to the Link's default behaviour.
 */
export default function HeaderLogoLink() {
  const pathname = usePathname();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (pathname !== "/") return;
    event.preventDefault();
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return (
    <Link href="/" className="shrink-0" onClick={handleClick}>
      <Image
        src="/images/rasam-logo.png"
        alt="RASAM Spices home"
        width={84}
        height={48}
        priority
        className="h-11 w-auto object-contain sm:h-12"
      />
    </Link>
  );
}
