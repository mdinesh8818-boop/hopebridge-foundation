"use client";

import { FormEvent, useState } from "react";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus("error");
      return;
    }

    // Provider-ready: no email service is configured yet.
    // Persist interest locally so the control is intentional and honest.
    try {
      const key = "hopebridge_newsletter_interest";
      const existing = JSON.parse(window.localStorage.getItem(key) || "[]") as string[];
      if (!existing.includes(trimmed)) {
        existing.push(trimmed);
        window.localStorage.setItem(key, JSON.stringify(existing));
      }
      setStatus("saved");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "space-y-3"} noValidate>
      <label className="sr-only" htmlFor="newsletter-email">
        Email address
      </label>
      <div className={`flex ${compact ? "flex-col gap-2" : "flex-col gap-2 sm:flex-row"}`}>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="you@example.org"
          className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3 text-sm"
          aria-invalid={status === "error"}
        />
        <button type="submit" className="hb-gold-btn pub-focus-ring rounded-xl px-5 py-3 text-sm font-bold whitespace-nowrap">
          Subscribe
        </button>
      </div>
      {status === "saved" ? (
        <p className="text-sm text-[#0d5f44]">
          Interest saved on this device. An email delivery provider has not been connected yet.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm text-[#9a3412]">Enter a valid email address to continue.</p>
      ) : null}
      {status === "idle" && !compact ? (
        <p className="text-xs text-[#65766e]">
          Updates signup is prepared for a future email provider. No messages are sent yet.
        </p>
      ) : null}
    </form>
  );
}
