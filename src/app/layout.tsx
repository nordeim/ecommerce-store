import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * Root layout — deliberately minimal. Only the document shell (fonts,
 * globals, metadata) lives here so that chrome-less surfaces can exist:
 * the reference's standalone auth screens (`(auth)` group) and its
 * platform-level 404 (src/app/not-found.tsx) render WITHOUT the storefront
 * chrome, which lives in `src/app/(storefront)/layout.tsx` instead.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lumina",
    template: "%s | Lumina",
  },
  description:
    "LUXE Store — curated collection of premium products for modern living. Quality meets style in every piece.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  // Reference parity (session-7, FAVICON-1): the reference injects
  // <link rel="icon"> pointing at its media-CDN logo (its /favicon.ico 302s
  // to the same asset). We follow the repo's remote-CDN pixel-parity pattern
  // (product art already lives on media.base44.com by design) instead of
  // shipping a binary — measured live 2026-10-07.
  icons: {
    icon: "https://media.base44.com/images/public/69d296f5d1237b9a1afec899/76cff797e_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
