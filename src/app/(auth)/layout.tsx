/**
 * Auth layout (route group `(auth)` — URL-neutral). The reference renders
 * /login and /register as STANDALONE screens: no announcement bar, no
 * header, no footer — just a full-height centered card on the page
 * background (wrapper captured live on the reference, 2026-10-07:
 * `min-h-screen flex items-center justify-center bg-background px-4`).
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen flex items-center justify-center bg-background px-4">{children}</div>;
}
