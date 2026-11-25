import { glyphFor } from "@/data/social-glyphs";

export type PublicSocialLink = {
  platform: string;
  url: string;
};

/**
 * Social links for the public site, rendered as brand icons.
 *
 * The links come from the SocialLink records an admin manages in Settings —
 * there is no second configuration and nothing is hardcoded here. A platform
 * with no saved URL simply has no record, so no icon is rendered: there are
 * never placeholder or "#" links.
 */
export default function SocialIcons({
  links,
  className = "",
  tone = "light",
}: {
  links: PublicSocialLink[];
  className?: string;
  /** "light" for icons on a dark surface (footer), "dark" for light surfaces. */
  tone?: "light" | "dark";
}) {
  if (links.length === 0) return null;

  const base =
    tone === "light"
      ? "text-ivory/75 hover:text-turmeric focus-visible:text-turmeric"
      : "text-earth-muted hover:text-spice focus-visible:text-spice";

  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {links.map((link) => {
        const glyph = glyphFor(link.platform);
        return (
          <li key={`${link.platform}-${link.url}`}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.platform} (opens in a new tab)`}
              title={link.platform}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-current/25 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric ${base}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path d={glyph.path} />
              </svg>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
