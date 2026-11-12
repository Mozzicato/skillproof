import { headers } from "next/headers";
import QRCode from "qrcode";
import { formatDate } from "@/components/ui";
import type { Endorsement } from "@/lib/types";

/** The public address of this deployment, taken from the request so links work locally and on Vercel. */
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function QrCode({ url, label }: { url: string; label: string }) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0b302dff", light: "#ffffffff" } });
  return <div className="qr" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function EndorsementItem({ item }: { item: Endorsement }) {
  return (
    <blockquote className="vouch">
      <p>“{item.statement}”</p>
      <footer className="small">
        <strong>{item.name}</strong>, {item.role.toLowerCase()} at {item.organisation}. {formatDate(item.createdAt)}{" "}
        {item.verified ? (
          <span className={`badge ${item.verified.work ? "good" : ""}`} title={`Verified by a code sent to an address at ${item.verified.domain}`}>
            {item.verified.work ? "Work email verified" : "Email verified"}: {item.verified.domain}
          </span>
        ) : (
          <span className="badge">Not verified</span>
        )}
      </footer>
    </blockquote>
  );
}
