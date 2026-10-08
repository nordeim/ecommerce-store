import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SITE_DESCRIPTION } from "@/lib/metadata";
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
  // Reference parity (session-9, METADATA-OG-1): the reference's site
  // description — measured live 2026-10-08 on every route's head (the old
  // "LUXE Store — curated collection…" text drifted).
  description: SITE_DESCRIPTION,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  // Reference parity (session-7, FAVICON-1): the reference injects
  // <link rel="icon"> pointing at its media-CDN logo (its /favicon.ico 302s
  // to the same asset). We follow the repo's remote-CDN pixel-parity pattern
  // (product art already lives on media.base44.com by design) instead of
  // shipping a binary — measured live 2026-10-07.
  icons: {
    icon: "https://media.base44.com/images/public/69d296f5d1237b9a1afec899/76cff797e_logo.png",
  },
  // Reference parity (session-9, METADATA-OG-1): the PWA head set the
  // reference renders site-wide — apple-mobile-web-app-capable/title/
  // status-bar-style via Next's appleWebApp (which ALSO emits
  // mobile-web-app-capable itself — adding it to `other` would duplicate
  // the tag). Measured live 2026-10-08.
  appleWebApp: {
    capable: true,
    title: "Lumina",
    statusBarStyle: "black",
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
