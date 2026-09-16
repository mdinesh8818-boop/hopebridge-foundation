"use client";

import { FormEvent, useState } from "react";

type InquiryKind = "general" | "partner" | "fundraise" | "press";

export function ContactInquiryForm({
  defaultKind = "general",
  submitLabel = "Send message",
}: {
  defaultKind?: InquiryKind;
  submitLabel?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [kind, setKind] = useState<InquiryKind>(defaultKind);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.includes("@") || message.trim().length < 10) {
      setStatus("error");
      setFeedback("Please provide your name, a valid email, and a message (at least 10 characters).");
      return;
    }

    const inquiry = {
      type: "public_inquiry",
      kind,
      name: name.trim(),
      email: email.trim(),
      organization: organization.trim() || null,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const key = "hopebridge_public_inquiries";
      const existing = JSON.parse(window.localStorage.getItem(key) || "[]") as unknown[];
      existing.push(inquiry);
      window.localStorage.setItem(key, JSON.stringify(existing));
      setStatus("saved");
      setFeedback(
        "Message saved on this device for demo follow-up. Connect an inbox or CRM webhook before production use.",
      );
      setMessage("");
    } catch {
      setStatus("error");
      setFeedback("Unable to save your message on this device. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#e8decb] bg-white p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="inq-name">
            Full name
          </label>
          <input
            id="inq-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="inq-email">
            Email
          </label>
          <input
            id="inq-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="inq-org">
            Organization (optional)
          </label>
          <input
            id="inq-org"
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="inq-kind">
            Topic
          </label>
          <select
            id="inq-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as InquiryKind)}
            className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
          >
            <option value="general">General inquiry</option>
            <option value="partner">Partnership</option>
            <option value="fundraise">Fundraising</option>
            <option value="press">Press / media</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="inq-message">
          Message
        </label>
        <textarea
          id="inq-message"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
        />
      </div>

      {feedback ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            status === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-[#cfe4d8] bg-[#f2faf6] text-[#0d5f44]"
          }`}
          role="status"
        >
          {feedback}
        </p>
      ) : null}

      <button type="submit" className="hb-emerald-btn pub-focus-ring rounded-xl px-5 py-3 text-sm font-semibold">
        {submitLabel}
      </button>
    </form>
  );
}
