"use client";

import { FormEvent, useMemo, useState } from "react";
import { PUBLIC_PROGRAMS } from "@/data/public-content";

const SUGGESTED_AMOUNTS = [25, 50, 100, 250];

type Frequency = "one-time" | "monthly";

export function DonationForm({ initialProgramSlug }: { initialProgramSlug?: string }) {
  const [frequency, setFrequency] = useState<Frequency>("one-time");
  const [amount, setAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [programSlug, setProgramSlug] = useState(initialProgramSlug ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");

  const selectedAmount = useMemo(() => {
    if (customAmount.trim()) {
      const parsed = Number(customAmount);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
    return amount;
  }, [amount, customAmount]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setMessage("");

    if (!name.trim() || !email.includes("@") || !selectedAmount) {
      setStatus("error");
      setMessage("Please provide your name, a valid email, and a gift amount.");
      return;
    }

    const intent = {
      type: "charitable_donation",
      frequency,
      amount: selectedAmount,
      currency: "USD",
      programSlug: programSlug || null,
      donorName: name.trim(),
      donorEmail: email.trim(),
      createdAt: new Date().toISOString(),
      paymentProvider: "not_configured",
    };

    try {
      const key = "hopebridge_donation_intents";
      const existing = JSON.parse(window.localStorage.getItem(key) || "[]") as unknown[];
      existing.push(intent);
      window.localStorage.setItem(key, JSON.stringify(existing));
      setStatus("ready");
      setMessage(
        "Your donation intent was saved. Live card payments are not enabled yet — HopeBridge is provider-ready for Stripe, PayPal, or another approved gateway. No payment was processed.",
      );
    } catch {
      setStatus("error");
      setMessage("Unable to save your donation intent on this device. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="rounded-2xl border border-[#e8decb] bg-white p-5 sm:p-6">
        <p className="text-xs font-bold tracking-[0.14em] text-[#0d5f44] uppercase">Gift type</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(
            [
              ["one-time", "One Time"],
              ["monthly", "Monthly"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFrequency(value)}
              className={`pub-focus-ring rounded-xl border px-4 py-3 text-sm font-semibold ${
                frequency === value
                  ? "border-[#0d5f44] bg-[#0d5f44] text-white"
                  : "border-[#e4dac6] bg-[#fffdf6] text-[#2d493e]"
              }`}
              aria-pressed={frequency === value}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs font-bold tracking-[0.14em] text-[#0d5f44] uppercase">Amount (USD)</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SUGGESTED_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setAmount(value);
                setCustomAmount("");
              }}
              className={`pub-focus-ring rounded-xl border px-4 py-3 text-sm font-semibold ${
                amount === value && !customAmount
                  ? "border-[#d4a228] bg-[#fff8e8] text-[#073b2f]"
                  : "border-[#e4dac6] bg-[#fffdf6] text-[#2d493e]"
              }`}
              aria-pressed={amount === value && !customAmount}
            >
              ${value}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-sm text-[#4d6359]" htmlFor="custom-amount">
          Custom amount
        </label>
        <input
          id="custom-amount"
          type="number"
          min={1}
          step="1"
          inputMode="decimal"
          value={customAmount}
          onChange={(event) => {
            setCustomAmount(event.target.value);
            setAmount(null);
          }}
          placeholder="Enter amount"
          className="hb-input pub-focus-ring mt-1 w-full rounded-xl px-4 py-3"
        />

        <label className="mt-6 block text-sm text-[#4d6359]" htmlFor="gift-designation">
          Designate to a program (optional)
        </label>
        <select
          id="gift-designation"
          value={programSlug}
          onChange={(event) => setProgramSlug(event.target.value)}
          className="hb-input pub-focus-ring mt-1 w-full rounded-xl px-4 py-3"
        >
          <option value="">Where most needed</option>
          {PUBLIC_PROGRAMS.map((program) => (
            <option key={program.slug} value={program.slug}>
              {program.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-[#e8decb] bg-white p-5 sm:p-6">
        <p className="text-xs font-bold tracking-[0.14em] text-[#0d5f44] uppercase">Donor information</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="donor-name">
              Full name
            </label>
            <input
              id="donor-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="donor-email">
              Email
            </label>
            <input
              id="donor-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
            />
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#4d6359]">
          This form collects charitable donation intent only. HopeBridge does not collect or process card
          numbers here. SaaS subscription billing for the operating platform is a separate payment concept
          and is not handled on this page.
        </p>
      </div>

      {message ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            status === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-[#cfe4d8] bg-[#f2faf6] text-[#0d5f44]"
          }`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <button type="submit" className="hb-gold-btn pub-focus-ring w-full rounded-xl px-5 py-3.5 text-sm font-bold">
        Continue — payment provider pending
      </button>
    </form>
  );
}
