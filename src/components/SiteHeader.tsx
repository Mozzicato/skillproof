import Link from "next/link";
import { Brand } from "@/components/Brand";
import { SignOutButton } from "@/components/AuthForms";
import { currentUser } from "@/lib/auth";

export async function SiteHeader({ section }: { section?: string }) {
  const user = await currentUser();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        {section && <span className="site-section">{section}</span>}
        <nav className="site-nav" aria-label="Main">
          <Link href="/university">Universities</Link>
          <Link href="/employer">Employers</Link>
          <Link href="/pricing">Pricing</Link>
          {user ? (
            <>
              <Link className="btn btn-sm" href="/student">My dashboard</Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link className="btn btn-sm" href="/signup">Create account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
