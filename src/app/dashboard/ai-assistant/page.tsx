"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  fetchAttentionItems,
  fetchOrganizationSnapshot,
  formatCurrency,
  type AttentionItem,
  type OrganizationSnapshot,
} from "@/services/organizationMetrics";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  time: string;
};

const suggestedQuestions = [
  "Which campaign needs attention?",
  "How can we improve donor retention?",
  "Summarize program performance",
  "What should leadership prioritize?",
];

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    text:
      "Hello. I am HopeBridge AI. I analyze your organization's real Firestore data — campaigns, donors, programs, volunteers, and beneficiaries. What would you like to review?",
    time: "Now",
  },
];

async function getAiResponse(
  question: string,
  snapshot: OrganizationSnapshot,
): Promise<string> {
  const message = question.toLowerCase();
  const hasData =
    snapshot.activeCampaigns > 0 ||
    snapshot.activePrograms > 0 ||
    snapshot.beneficiaryCount > 0 ||
    snapshot.volunteerCount > 0 ||
    snapshot.fundsRaised > 0 ||
    snapshot.activeDonors > 0;

  if (!hasData) {
    return "There is not enough HopeBridge data yet to answer that question. Create campaigns, programs, donors, volunteers, or beneficiaries to enable insights.";
  }

  if (
    message.includes("campaign") ||
    message.includes("fundraising") ||
    message.includes("attention")
  ) {
    if (snapshot.activeCampaigns === 0) {
      return "You have no active campaigns. Create a campaign to begin tracking fundraising progress.";
    }
    const goalPct =
      snapshot.totalCampaignGoal > 0
        ? Math.round((snapshot.fundsRaised / snapshot.totalCampaignGoal) * 100)
        : 0;
    return `You have ${snapshot.activeCampaigns} active campaign${snapshot.activeCampaigns === 1 ? "" : "s"}. Combined fundraising progress is ${goalPct}% (${formatCurrency(snapshot.fundsRaised)} of ${formatCurrency(snapshot.totalCampaignGoal)} goal). Review campaigns with approaching deadlines or low progress.`;
  }

  if (
    message.includes("donor") ||
    message.includes("retention") ||
    message.includes("donation")
  ) {
    if (snapshot.activeDonors === 0) {
      return "No donor records exist yet. Add donors or record donations to enable donor analysis.";
    }
    return `You have ${snapshot.activeDonors} active donor${snapshot.activeDonors === 1 ? "" : "s"} with ${formatCurrency(snapshot.fundsRaised)} recorded in fundraising totals. Continue recording gifts to improve retention analysis.`;
  }

  if (
    message.includes("program") ||
    message.includes("performance") ||
    message.includes("summary")
  ) {
    if (snapshot.activePrograms === 0) {
      return "No active programs found. Create a program to begin tracking service delivery.";
    }
    return `HopeBridge has ${snapshot.activePrograms} active program${snapshot.activePrograms === 1 ? "" : "s"} with ${formatCurrency(snapshot.totalProgramBudget)} total budget and ${formatCurrency(snapshot.totalProgramSpent)} spent. ${snapshot.programsOnTrack} program${snapshot.programsOnTrack === 1 ? "" : "s"} on target; ${snapshot.programsAtRisk} at risk.`;
  }

  if (
    message.includes("volunteer") ||
    message.includes("shift") ||
    message.includes("hours")
  ) {
    if (snapshot.volunteerCount === 0) {
      return "No volunteers registered yet. Add volunteers to track hours and assignments.";
    }
    return `${snapshot.volunteerCount} volunteer${snapshot.volunteerCount === 1 ? "" : "s"} registered with ${snapshot.volunteerHours} total hours logged. Review volunteers marked as needing attention.`;
  }

  if (
    message.includes("beneficiar") ||
    message.includes("people") ||
    message.includes("community")
  ) {
    if (snapshot.beneficiaryCount === 0) {
      return "No beneficiaries enrolled yet. Enroll beneficiaries to track service delivery and outcomes.";
    }
    return `${snapshot.beneficiaryCount} beneficiar${snapshot.beneficiaryCount === 1 ? "y" : "ies"} currently in the system across your programs.`;
  }

  if (
    message.includes("priority") ||
    message.includes("leadership") ||
    message.includes("recommend")
  ) {
    const actions: string[] = [];
    if (snapshot.programsAtRisk > 0) {
      actions.push(`review ${snapshot.programsAtRisk} at-risk program${snapshot.programsAtRisk === 1 ? "" : "s"}`);
    }
    if (snapshot.activeCampaigns > 0 && snapshot.totalCampaignGoal > snapshot.fundsRaised) {
      actions.push("accelerate fundraising on active campaigns");
    }
    if (snapshot.activeDonors === 0) {
      actions.push("begin donor cultivation");
    }
    if (actions.length === 0) {
      return "Based on current data, no urgent leadership actions are flagged. Continue monitoring operational metrics.";
    }
    return `Leadership should prioritize: ${actions.join("; ")}. These recommendations are based on your current HopeBridge records.`;
  }

  return `Based on your HopeBridge data: ${snapshot.activeCampaigns} active campaigns, ${snapshot.activePrograms} active programs, ${snapshot.activeDonors} active donors, ${snapshot.volunteerCount} volunteers, and ${snapshot.beneficiaryCount} beneficiaries. Ask about a specific module for deeper analysis.`;
}

function currentTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [snapshot, setSnapshot] = useState<OrganizationSnapshot | null>(null);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);

  useEffect(() => {
    fetchOrganizationSnapshot().then(setSnapshot).catch(() => setSnapshot(null));
    fetchAttentionItems().then(setAttentionItems).catch(() => setAttentionItems([]));
  }, []);

  const conversationCount = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages]
  );

  function sendMessage(text?: string) {
    const question = (text ?? input).trim();

    if (!question || isThinking) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: question,
      time: currentTime(),
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setIsThinking(true);

    window.setTimeout(async () => {
      const snapshot = await fetchOrganizationSnapshot();
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        text: await getAiResponse(question, snapshot),
        time: currentTime(),
      };

      setMessages((previous) => [...previous, assistantMessage]);
      setIsThinking(false);
    }, 700);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  function clearConversation() {
    setMessages(initialMessages);
    setInput("");
    setIsThinking(false);
  }

  return (
    <main className="min-h-screen bg-[#050706] px-5 py-6 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white/80 transition hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
          >
            <span>←</span>
            Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={clearConversation}
            className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/75 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
          >
            Clear Conversation
          </button>
        </div>

        <section className="mb-6 overflow-hidden rounded-[28px] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.10] via-[#0b100f] to-cyan-500/[0.08] p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                ✦ HopeBridge Intelligence
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                AI Assistant
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-white/55 sm:text-lg">
                Ask strategic questions, identify risks, discover opportunities,
                and receive nonprofit recommendations based on HopeBridge data.
              </p>
            </div>

            <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[430px]">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs text-white/40">Conversations</p>
                <p className="mt-2 text-2xl font-bold">{conversationCount}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs text-white/40">AI status</p>
                <p className="mt-2 text-sm font-semibold text-emerald-300">
                  ● Online
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs text-white/40">Data coverage</p>
                <p className="mt-2 text-2xl font-bold">8</p>
                <p className="text-xs text-white/35">Modules connected</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs text-white/40">Confidence</p>
                <p className="mt-2 text-2xl font-bold text-cyan-300">94%</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="flex min-h-[680px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1110] shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-7">
              <div>
                <p className="text-lg font-semibold">Strategic conversation</p>
                <p className="mt-1 text-sm text-white/40">
                  HopeBridge organizational intelligence
                </p>
              </div>

              <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                AI ready
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-7">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-5 py-4 sm:max-w-[78%] ${
                      message.role === "user"
                        ? "rounded-br-md bg-gradient-to-r from-amber-400 to-orange-500 text-black"
                        : "rounded-bl-md border border-white/10 bg-white/[0.05] text-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          message.role === "user"
                            ? "text-black/70"
                            : "text-emerald-300"
                        }`}
                      >
                        {message.role === "user"
                          ? "You"
                          : "HopeBridge AI"}
                      </span>

                      <span
                        className={`text-[11px] ${
                          message.role === "user"
                            ? "text-black/45"
                            : "text-white/30"
                        }`}
                      >
                        {message.time}
                      </span>
                    </div>

                    <p className="whitespace-pre-line text-sm leading-6 sm:text-[15px]">
                      {message.text}
                    </p>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-5 py-4">
                    <p className="text-xs font-semibold text-emerald-300">
                      HopeBridge AI
                    </p>
                    <div className="mt-3 flex gap-1.5">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 bg-black/20 p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap gap-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => sendMessage(question)}
                    disabled={isThinking}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/65 transition hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask HopeBridge AI a strategic question..."
                  className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-[#080b0a] px-5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  className="min-h-14 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-7 font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Send →
                </button>
              </form>

              <p className="mt-3 text-center text-[11px] text-white/25">
                Responses are based on your organization&apos;s real HopeBridge data.
              </p>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[26px] border border-amber-400/20 bg-gradient-to-br from-amber-400/[0.09] to-orange-500/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                Priority risk
              </p>

              {attentionItems.length === 0 ? (
                <>
                  <h2 className="mt-3 text-xl font-semibold">No urgent risks</h2>
                  <p className="mt-3 text-sm leading-6 text-white/50">
                    No items need attention based on current records.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-3 text-xl font-semibold">{attentionItems[0].title}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/50">
                    {attentionItems[0].detail}
                  </p>
                  <Link
                    href={attentionItems[0].href}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-sm font-bold text-black transition hover:brightness-110"
                  >
                    Review →
                  </Link>
                </>
              )}
            </section>

            <section className="rounded-[26px] border border-white/10 bg-[#0d1110] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Live intelligence
              </p>

              <div className="mt-5 space-y-4">
                {!snapshot ||
                (snapshot.activeDonors === 0 &&
                  snapshot.programsAtRisk === 0 &&
                  snapshot.beneficiaryCount === 0) ? (
                  <p className="text-sm text-white/40">
                    No AI insights available yet. HopeBridge AI will generate insights when sufficient real data exists.
                  </p>
                ) : (
                  <>
                    {snapshot.activeDonors > 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-sm font-semibold">Donor portfolio</p>
                        <p className="mt-2 text-xs leading-5 text-white/40">
                          {snapshot.activeDonors} active donor{snapshot.activeDonors === 1 ? "" : "s"} on file.
                        </p>
                        <p className="mt-3 text-sm font-bold text-emerald-300">
                          Raised: {formatCurrency(snapshot.fundsRaised)}
                        </p>
                      </div>
                    )}
                    {snapshot.programsAtRisk > 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-sm font-semibold">Program warning</p>
                        <p className="mt-2 text-xs leading-5 text-white/40">
                          {snapshot.programsAtRisk} program{snapshot.programsAtRisk === 1 ? "" : "s"} at risk.
                        </p>
                      </div>
                    )}
                    {snapshot.beneficiaryCount > 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-sm font-semibold">Community reach</p>
                        <p className="mt-2 text-xs leading-5 text-white/40">
                          {snapshot.beneficiaryCount} beneficiar{snapshot.beneficiaryCount === 1 ? "y" : "ies"} enrolled.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            <section className="rounded-[26px] border border-emerald-400/20 bg-emerald-400/[0.06] p-6">
              <p className="text-sm font-semibold text-emerald-300">
                Connected modules
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/55">
                {[
                  "Campaigns",
                  "Programs",
                  "Donors",
                  "Volunteers",
                  "Beneficiaries",
                  "Teams",
                  "Reports",
                  "Analytics",
                ].map((module) => (
                  <div
                    key={module}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-3"
                  >
                    <span className="mr-2 text-emerald-300">●</span>
                    {module}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

