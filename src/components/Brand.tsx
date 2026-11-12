import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" width={36} height={33} />
      <span>SkillProof <span className="brand-ai">AI</span></span>
    </Link>
  );
}
