"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

function VerifyingContent() {
  const router = useRouter();
  const search = useSearchParams();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const provider = search.get("provider");
    const reference = search.get("reference");
    const transactionId = search.get("transactionId") ?? undefined;

    if (!provider || !reference) {
      router.replace("/onboarding?payment=failed");
      return;
    }

    let cancelled = false;
    const fail = () => {
      if (cancelled) return;
      setFailed(true);
      setTimeout(() => {
        if (!cancelled) router.replace("/onboarding?payment=failed");
      }, 1500);
    };

    (async () => {
      try {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, reference, transactionId }),
        });
        const data = (await res.json().catch(() => ({ success: false }))) as {
          success?: boolean;
        };
        if (cancelled) return;
        if (res.ok && data.success) {
          router.replace("/onboarding?payment=success");
        } else {
          fail();
        }
      } catch {
        fail();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [search, router]);

  if (failed) {
    return (
      <FullScreenLoader
        variant="error"
        title="Couldn't confirm payment"
        description="Taking you back to try again…"
      />
    );
  }

  return (
    <FullScreenLoader
      title="Verifying your payment"
      description="Hang tight — this only takes a moment."
    />
  );
}

export default function PaymentVerifyingPage() {
  return (
    <Suspense fallback={<FullScreenLoader title="Verifying your payment" />}>
      <VerifyingContent />
    </Suspense>
  );
}
