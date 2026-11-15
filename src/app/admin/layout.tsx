import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | RASAM Admin",
    default: "RASAM Admin",
  },
  description: "RASAM Spices administration panel",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main id="main" className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      {children}
    </main>
  );
}
