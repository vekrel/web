import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AuthSurfaceShell } from "../auth/AuthSurfaceShell";
import { Button } from "../ui/button";
import { completeAccountSignIn, startAccountSignIn } from "./accountAuth";

// One exchange per callback URL: StrictMode runs effects twice and the code is single use.
let exchange: { readonly href: string; readonly result: Promise<string> } | null = null;
function exchangeOnce(href: string): Promise<string> {
  if (exchange?.href !== href) exchange = { href, result: completeAccountSignIn(href) };
  return exchange.result;
}

/** `/auth/callback`: the relay sends the tab back here with `code` and `state`. */
export function AccountCallbackSurface() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    exchangeOnce(window.location.href).then(
      (returnTo) => {
        if (!cancelled) void navigate({ href: returnTo, replace: true });
      },
      (cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <AuthSurfaceShell>
      <p className="text-3xs font-semibold tracking-widest text-primary uppercase">
        Vekrel account
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        {error ? "Sign-in did not finish" : "Signing you in"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {error ?? "Finishing sign-in with Vekrel Connect…"}
      </p>
      {error ? (
        <div className="mt-6 flex gap-2">
          <Button type="button" onClick={() => startAccountSignIn(window.location.origin)}>
            Sign in again
          </Button>
          <Button type="button" variant="outline" onClick={() => void navigate({ to: "/" })}>
            Go home
          </Button>
        </div>
      ) : null}
    </AuthSurfaceShell>
  );
}
