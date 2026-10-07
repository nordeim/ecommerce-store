/**
 * AuthErrorBox — the reference's auth error presentation (session-4).
 *
 * Every auth error on the reference (login failures, duplicate registration,
 * password mismatch, invalid verification codes, unverified-login blocks)
 * renders as the same tinted alert box DIRECTLY inside the card, above the
 * form, with mb-4 spacing. Measured live 2026-10-07:
 * `div.mb-4.p-3.rounded-lg.bg-destructive/10.text-destructive.text-sm`.
 * (No role attribute — the reference has none; the box is decorative
 * repetition of the form's aria-disabled state.)
 */
export function AuthErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{message}</div>
  );
}
