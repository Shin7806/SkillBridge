import { ButtonLink } from "@/components/kit";
import { PublicShell } from "@/components/public-shell";
import { useAuth } from "@/lib/auth";
import { useDocumentTitle } from "@/lib/hooks";

export default function NotFound() {
  useDocumentTitle("Page not found");
  const { user } = useAuth();
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <p className="text-7xl font-semibold tracking-tighter text-primary">404</p>
        <h1 className="mt-4 text-2xl font-bold">This page doesn't exist</h1>
        <p className="mt-2 text-muted-foreground">The link may be old, or the address may have a typo.</p>
        <ButtonLink to={user ? "/home" : "/"} className="mt-8">
          {user ? "Back to home" : "Go to the start"}
        </ButtonLink>
      </div>
    </PublicShell>
  );
}
