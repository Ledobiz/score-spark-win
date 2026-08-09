"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { ShuzamLogo } from "@/components/shuzam/logo";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Mode = "signin" | "signup" | "forgot";
const POST_AUTH = "/predictions";

/** Minimal shape of the bits of Google Identity Services we use. */
interface GoogleCodeClient {
  requestCode(): void;
}
interface GoogleAccountsOAuth2 {
  initCodeClient(config: {
    client_id: string;
    scope: string;
    ux_mode: "popup";
    callback: (response: { code?: string }) => void;
    error_callback?: (error: { type?: string }) => void;
  }): GoogleCodeClient;
}
declare global {
  interface Window {
    google?: { accounts: { oauth2: GoogleAccountsOAuth2 } };
  }
}

function AuthForm() {
  const router = useRouter();
  const search = useSearchParams();

  const initialMode = (search.get("mode") as Mode | null) ?? "signin";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [ageOk, setAgeOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const [redirecting, setRedirecting] = useState<string | null>(null);

  const continueWithGoogle = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!gsiReady || !window.google || !clientId) {
      toast.error("Google sign-in isn't ready yet — try again in a moment.");
      return;
    }
    setGoogleLoading(true);
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: async (response) => {
        if (!response.code) {
          setGoogleLoading(false);
          return;
        }
        try {
          const res = await signIn("google-popup", { code: response.code, redirect: false });
          if (res?.error) {
            toast.error("Could not sign in with Google");
            setGoogleLoading(false);
            return;
          }
          // Keep the button spinning and hand off to a full-page loader —
          // otherwise the button flips back to idle for a moment while
          // Next.js resolves the destination page, which reads as "did that
          // work?" rather than "signing you in".
          setRedirecting("Signing you in…");
          router.replace(POST_AUTH);
        } catch {
          toast.error("Could not sign in with Google");
          setGoogleLoading(false);
        }
      },
      error_callback: () => {
        setGoogleLoading(false);
      },
    });
    client.requestCode();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!ageOk) {
          toast.error("You must confirm you are 18 or older.");
          return;
        }
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName, ageConfirmed: ageOk }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not create your account");

        const signInRes = await signIn("credentials", { email, password, redirect: false });
        if (signInRes?.error) throw new Error("Account created — please sign in");
        setRedirecting("Setting up your account…");
        router.replace("/onboarding");
      } else if (mode === "signin") {
        const res = await signIn("credentials", { email, password, redirect: false });
        if (res?.error) throw new Error("Incorrect email or password");
        setRedirecting("Signing you in…");
        router.replace(POST_AUTH);
      } else {
        await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        toast.success("If that email exists, a reset link has been sent.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (redirecting) {
    return <FullScreenLoader title={redirecting} description="Just a moment…" />;
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-8">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setGsiReady(true)}
      />
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center" aria-label="SHUZAM home">
          <ShuzamLogo />
        </Link>
        <Card className="p-6">
          <h1 className="text-2xl font-bold">
            {mode === "signin"
              ? "Welcome back"
              : mode === "signup"
                ? "Create your account"
                : "Reset password"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to continue"
              : mode === "signup"
                ? "Start your free trial"
                : "We'll email you a reset link"}
          </p>

          {mode !== "forgot" && (
            <>
              <Button
                type="button"
                variant="outline"
                className="mt-6 w-full gap-2"
                disabled={googleLoading}
                onClick={continueWithGoogle}
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>
              <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={submit} className={mode === "forgot" ? "mt-6 space-y-4" : "mt-4 space-y-4"}>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>
            )}
            {mode === "signup" && (
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={ageOk}
                  onCheckedChange={(v) => setAgeOk(Boolean(v))}
                  className="mt-0.5"
                />
                <span>
                  I confirm I am 18 or older and understand the risks of gambling. I agree to the{" "}
                  <Link href="/terms" className="font-medium text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            )}
            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-semibold text-primary hover:underline"
                >
                  Create account
                </button>
              </>
            ) : mode === "signup" ? (
              <>
                Already have one?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-primary hover:underline"
              >
                Back to sign in
              </button>
            )}
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
