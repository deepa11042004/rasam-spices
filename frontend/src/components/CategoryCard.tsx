import Image from "next/image";
import Link from "next/link";

type CategoryCardProps = {
  title: string;
  description: string;
  href: string;
  image: { src: string; alt: string };
  /** CSS object-position for the cover photo; defaults to centred. */
  imagePosition?: string;
};

/**
 * Homepage category card: a photo, title, short description and a "View products" indicator,
 * the whole card a single link to the matching category section on /products.
 * Ivory surface (distinct from the dark .rasam-card product cards) so it reads as navigation,
 * not a product for sale.
 */
export default function CategoryCard({
  title,
  description,
  href,
  image,
  imagePosition = "50% 50%",
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-cacao/30 bg-ivory shadow-card transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-spice/60 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spice"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 45vw, 90vw"
          quality={75}
          className="object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.04]"
          style={{ objectPosition: imagePosition }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/55 via-charcoal/5 to-transparent"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-6 sm:p-7">
        <h3 className="font-serif text-2xl font-semibold text-earth sm:text-3xl">{title}</h3>
        <p className="text-sm leading-6 text-earth-muted sm:text-base">{description}</p>
        <span className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-spice transition-colors group-hover:text-spice-dark">
          View products
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
