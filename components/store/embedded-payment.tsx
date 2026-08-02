"use client";

import { useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { Alert } from "@/components/ui";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export function EmbeddedPayment({ clientSecret }: { clientSecret: string }) {
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [],
  );

  if (!stripePromise) {
    return (
      <Alert tone="error">
        Payment is not configured, set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and restart the server.
      </Alert>
    );
  }

  return (
    <div className="border-2 border-ink bg-white p-2 sm:p-4">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
