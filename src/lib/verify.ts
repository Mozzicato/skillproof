import { createHash, randomInt } from "node:crypto";

/** Personal mailbox providers. An address here proves a person, not an organisation. */
const PERSONAL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "ymail.com", "outlook.com", "hotmail.com", "hotmail.co.uk",
  "live.com", "msn.com", "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "zoho.com", "yandex.com",
]);

export const CODE_MINUTES = 15;
export const MAX_ATTEMPTS = 5;

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

export function isWorkEmail(email: string): boolean {
  const domain = emailDomain(email);
  return domain.includes(".") && !PERSONAL_DOMAINS.has(domain);
}

export function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Codes are stored hashed with the invite token, so a leaked record does not reveal the code. */
export function hashCode(token: string, code: string): string {
  return createHash("sha256").update(`${token}:${code}`).digest("hex");
}

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/**
 * Sends the code with Resend when RESEND_API_KEY is set. Without it the build runs in
 * demo mode and the caller shows the code on screen, labelled as such.
 */
export async function sendCode(email: string, code: string, studentName: string): Promise<"sent" | "demo"> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "demo";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "SkillProof AI <onboarding@resend.dev>",
      to: [email],
      subject: `Your code to confirm ${studentName}'s skills`,
      text: `Your SkillProof AI confirmation code is ${code}. It expires in ${CODE_MINUTES} minutes. If you did not ask for this, ignore this email.`,
    }),
  });
  if (!response.ok) throw new Error("We could not send the email. Check the address and try again.");
  return "sent";
}
