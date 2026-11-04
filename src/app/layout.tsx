
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingStarAnise from "@/components/FloatingStarAnise";

// All three faces below are self-hosted locally (next/font/local) instead of fetched from Google
// Fonts at build time (next/font/google), to avoid a Turbopack font-loader network-resolution
// failure in some environments. Same families, same weights, same visual appearance -- just
// bundled from disk instead of downloaded. See src/fonts/ (the variable-weight file is the exact
// same file the "geist" npm package ships internally; vendoring it here means the build no longer
// depends on that package's internal file layout surviving every future `npm install`).
const geistSans = localFont({
  src: "../fonts/geist-sans/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

// Editorial display face for headings.
const display = localFont({
  src: [
    {
      path: "../fonts/cormorant-garamond/cormorant-garamond-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/cormorant-garamond/cormorant-garamond-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/cormorant-garamond/cormorant-garamond-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

// Script face for the tagline (was a render-blocking @import from fonts.googleapis.com in globals.css).
const script = localFont({
  src: "../fonts/great-vibes/great-vibes-latin-400-normal.woff2",
  variable: "--font-script",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | RASAM Spices",
    default: "RASAM Spices | Authentic Indian Spices & Masalas",
  },
  description:
    "RASAM Spices brings the authentic taste of India to every home: ground spices, blended masalas and seasonings. Business enquiries welcome from retailers, wholesalers and distributors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${script.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-ivory focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <FloatingStarAnise />
      </body>
    </html>
  );
}
