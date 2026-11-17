import type { ReactNode } from "react";
import PublicChrome from "@/components/PublicChrome";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingStarAnise from "@/components/FloatingStarAnise";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PublicChrome
      header={<Header />}
      footer={<Footer />}
      floating={<FloatingStarAnise />}
    >
      {children}
    </PublicChrome>
  );
}
