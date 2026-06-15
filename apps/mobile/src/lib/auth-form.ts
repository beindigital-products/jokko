import { validatePassword } from "./password-validation";

/** Loose e-mail shape check — good enough to gate the submit button. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Whether the auth form may be submitted (drives the CTA's enabled/greyed state).
 * Sign-up stays locked until the e-mail is valid, the password meets the
 * requirements, AND the terms box is checked. Sign-in only needs both fields.
 */
export function canSubmitAuthForm(opts: {
  mode: "sign-in" | "sign-up";
  email: string;
  password: string;
  acceptedTerms: boolean;
}): boolean {
  const { mode, email, password, acceptedTerms } = opts;
  if (mode === "sign-up") {
    return looksLikeEmail(email) && validatePassword(password).valid && acceptedTerms;
  }
  return email.trim().length > 0 && password.length > 0;
}
