import type { ReactNode } from "react";
import PublicChrome from "@/components/PublicChrome";
import FloatingStarAnise from "@/components/FloatingStarAnise";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PublicChrome floating={<FloatingStarAnise />}>
      {children}
    </PublicChrome>
  );
}
