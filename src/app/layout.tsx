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
