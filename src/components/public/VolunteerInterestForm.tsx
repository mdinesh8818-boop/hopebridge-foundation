"use client";

import { FormEvent, useState } from "react";
import { VOLUNTEER_OPPORTUNITIES } from "@/data/public-content";

export function VolunteerInterestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [opportunityId, setOpportunityId] = useState(VOLUNTEER_OPPORTUNITIES[0]?.id ?? "");
  const [availability, setAvailability] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.includes("@") || !opportunityId) {
      setStatus("error");
      setFeedback("Please provide your name, a valid email, and an opportunity.");
      return;
    }

    const interest = {
      type: "volunteer_interest",
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      opportunityId,
      availability: availability.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
      integration: "pending_volunteers_module",
    };

    try {
      const key = "hopebridge_volunteer_interests";
      const existing = JSON.parse(window.localStorage.getItem(key) || "[]") as unknown[];
      existing.push(interest);
      window.localStorage.setItem(key, JSON.stringify(existing));
      setStatus("saved");
      setFeedback(
        "Thank you. Your interest was saved for follow-up. Full sync into the Volunteers module will be enabled when the intake integration is connected.",
      );
      setName("");
      setEmail("");
      setPhone("");
      setAvailability("");
      setMessage("");
    } catch {
      setStatus("error");
      setFeedback("Unable to save your interest on this device. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#e8decb] bg-white p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="vol-name">
            Full name
          </label>
          <input
            id="vol-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="vol-email">
            Email
          </label>
          <input
            id="vol-email"
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
          <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="vol-phone">
            Phone (optional)
          </label>
          <input
            id="vol-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="vol-opportunity">
            Opportunity
          </label>
          <select
            id="vol-opportunity"
            value={opportunityId}
            onChange={(event) => setOpportunityId(event.target.value)}
            className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
          >
            {VOLUNTEER_OPPORTUNITIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="vol-availability">
          Availability
        </label>
        <input
          id="vol-availability"
          value={availability}
          onChange={(event) => setAvailability(event.target.value)}
          placeholder="Evenings, weekends, event-based…"
          className="hb-input pub-focus-ring w-full rounded-xl px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[#4d6359]" htmlFor="vol-message">
          Message
        </label>
        <textarea
          id="vol-message"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
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
        Submit interest
      </button>
    </form>
  );
}
