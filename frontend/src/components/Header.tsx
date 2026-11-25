import HeaderLogoLink from "@/components/HeaderLogoLink";
import HeaderNav from "@/components/HeaderNav";
import { navLinks } from "@/data/company";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#80613A]/30 bg-[#C99A45]">
      <nav
        aria-label="Main navigation"
        className="relative mx-auto flex min-h-[80px] max-w-7xl items-center justify-between gap-6 px-6 lg:px-10"
      >
        {/* Logo: routes to "/" from elsewhere, smooth-scrolls to Hero when already on "/". */}
        <HeaderLogoLink />
        <HeaderNav links={navLinks} />
      </nav>
    </header>
  );
}