"use client";

import Link from "next/link";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CircleDollarSign,
  Eraser,
  HandHeart,
  Home,
  Loader2,
  Megaphone,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

import HopeBridgeSidebar from "../components/HopeBridgeSidebar";
import {
  answerOrganizationalQuestion,
  loadAiOrgContext,
  QUICK_ACTIONS,
  SUGGESTED_QUESTIONS,
  type AiAnswerSection,
  type AiOrgContext,
} from "@/services/aiIntelligence";
import "../analytics/analytics.css";
import "./ai-assistant.css";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sections?: AiAnswerSection[];
  time: string;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Welcome to HopeBridge Intelligence. Ask about campaigns, fundraising, programs, beneficiaries, volunteers, geographic reach, risks, or request an executive summary. Answers are built from your live organizational data — not invented.",
  time: "Now",
  sections: [
    {
      heading: "OBSERVATION",
      body: "Welcome to HopeBridge Intelligence. Ask about campaigns, fundraising, programs, beneficiaries, volunteers, geographic reach, risks, or request an executive summary. Answers are built from your live organizational data — not invented.",
    },
  ],
};

function formatClock(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function coverageLabel(state: string) {
  if (state === "connected") return "Connected";
  if (state === "limited") return "Limited data";
  return "No records";
}

function MessageBody({
  message,
}: {
  message: ChatMessage;
}) {
  if (message.role === "user" || !message.sections?.length) {
    return <p className="whitespace-pre-wrap">{message.text}</p>;
  }

  return (
    <div>
      {message.sections.map((section) => (
        <div key={`${message.id}-${section.heading}`} className="ai-section">
          <p className="ai-section-label">{section.heading}</p>
          <p className="ai-section-body">{section.body}</p>
        </div>
      ))}
    </div>
  );
}

export default function AiAssistantPage() {
  const router = useRouter();
  const [ctx, setCtx] = useState<AiOrgContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await loadAiOrgContext();
        if (!cancelled) setCtx(data);
      } catch (err) {
        console.error("Unable to load AI Assistant context.", err);
        if (!cancelled) {
          setError("Unable to load organizational intelligence. Please try again.");
          setCtx(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  function clearConversation() {
    setMessages([
      {
        ...WELCOME_MESSAGE,
        id: `welcome-${Date.now()}`,
        time: formatClock(),
      },
    ]);
    setChatError("");
    setInput("");
  }

  async function submitQuestion(raw: string) {
    const question = raw.trim();
    if (!question || sending) return;
    if (!ctx) {
      setChatError(
        "Organizational data is not available yet. Refresh the page or wait for data to finish loading.",
      );
      return;
    }

    setSending(true);
    setChatError("");
    setInput("");

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: question,
      time: formatClock(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Small delay keeps loading UX readable for fast deterministic answers
      await new Promise((resolve) => setTimeout(resolve, 180));
      const answer = answerOrganizationalQuestion(question, ctx);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: answer.text,
        sections: answer.sections,
        time: formatClock(),
      };
      startTransition(() => {
        setMessages((prev) => [...prev, assistantMessage]);
      });
    } catch (err) {
      console.error("Unable to answer organizational question.", err);
      setChatError("Unable to generate a response from HopeBridge data. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: "A temporary error occurred while analyzing organizational data.",
          time: formatClock(),
          sections: [
            {
              heading: "OBSERVATION",
              body: "A temporary error occurred while analyzing organizational data. Please retry your question.",
            },
          ],
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submitQuestion(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitQuestion(input);
    }
  }

  const risks = ctx?.impact.risks ?? [];
  const heroSources =
    ctx?.coverage.map((item) => item.module) ??
    [
      "Campaigns",
      "Programs",
      "Donors",
      "Volunteers",
      "Beneficiaries",
      "Teams",
      "Impact Analytics",
    ];

  return (
    <div className="hb-app ia-page ai-page">
      <HopeBridgeSidebar activePath="/dashboard/ai-assistant" />

      <main className="hb-module-main">
        <div className="mx-auto max-w-[1680px] space-y-6 pb-10">
          <nav className="flex items-center gap-2 text-sm text-[#607269]">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 hover:text-[#0d5f44]"
            >
              <Home size={14} className="text-[#0d5f44]" />
              HopeBridge Foundation
            </Link>
            <span>/</span>
            <strong className="text-[#112e24]">AI Assistant</strong>
          </nav>

          <header className="ia-hero">
            <p className="ia-hero-kicker">HOPEBRIDGE INTELLIGENCE</p>
            <h1>
              HopeBridge AI <em className="not-italic text-[#efd062]">Assistant</em>
            </h1>
            <p>
              Ask questions about your organization, identify risks, understand
              performance, and turn HopeBridge data into actionable nonprofit insights.
            </p>

            <div className="ai-status" role="status">
              <span className="ai-status-dot" aria-hidden />
              Organizational Intelligence Ready
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#efd062]">
                CONNECTED DATA SOURCES
              </p>
              <div className="ai-source-row" aria-label="Connected data sources">
                {heroSources.map((source) => (
                  <span key={source} className="ai-source-chip">
                    {source}
                  </span>
                ))}
              </div>
            </div>

            <div className="ia-hero-actions">
              <button
                type="button"
                className="ia-gold-btn"
                onClick={() => setRefreshToken((n) => n + 1)}
                disabled={loading}
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
                Refresh Data
              </button>
              <button
                type="button"
                className="ia-secondary-btn"
                onClick={() => router.push("/dashboard/analytics")}
              >
                <BarChart3 size={15} /> Open Impact Analytics
              </button>
              <button
                type="button"
                className="ia-secondary-btn"
                onClick={() => router.push("/dashboard")}
              >
                <Home size={15} /> Dashboard
              </button>
            </div>
          </header>

          {error ? (
            <div className="ai-error-banner" role="alert">
              {error}{" "}
              <button
                type="button"
                className="ml-2 font-bold underline"
                onClick={() => setRefreshToken((n) => n + 1)}
              >
                Retry
              </button>
            </div>
          ) : null}

          {/* Executive Briefing */}
          <section className="ia-panel" aria-label="Executive intelligence">
            <div className="ia-panel-header">
              <div>
                <p className="ia-kicker">EXECUTIVE INTELLIGENCE</p>
                <h2>Today&apos;s Organizational Briefing</h2>
                <p>
                  Deterministic summaries calculated from current HopeBridge records.
                </p>
              </div>
            </div>

            {loading && !ctx ? (
              <div className="px-6 py-8 text-sm text-[#607269]">
                <Loader2 className="mb-2 inline animate-spin text-[#0d5f44]" size={18} />{" "}
                Loading briefing from live modules…
              </div>
            ) : ctx ? (
              <div className="ai-briefing-grid">
                {ctx.briefing.map((card) => (
                  <article key={card.id} className={`ai-briefing-card ${card.tone}`}>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                    <button
                      type="button"
                      className="ia-ghost-btn self-start"
                      onClick={() => router.push(card.href)}
                    >
                      {card.actionLabel}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-sm text-[#607269]">
                Briefing unavailable until organizational data can be loaded.
              </div>
            )}
          </section>

          <div className="ai-workspace">
            {/* Strategic Conversation */}
            <section className="ia-panel ai-chat-shell" aria-label="Strategic conversation">
              <div className="ia-panel-header">
                <div>
                  <p className="ia-kicker">STRATEGIC CONVERSATION</p>
                  <h2>Strategic Conversation</h2>
                  <p>Ask questions using HopeBridge organizational data.</p>
                </div>
                <button
                  type="button"
                  className="ia-ghost-btn"
                  onClick={clearConversation}
                  disabled={sending}
                >
                  <Eraser size={14} /> Clear Conversation
                </button>
              </div>

              <div className="ai-messages" aria-live="polite">
                {messages.length === 0 ? (
                  <div className="ai-empty-chat">
                    <BrainCircuit className="mx-auto text-[#0d5f44]" size={28} />
                    <h3>Start with a nonprofit intelligence question</h3>
                    <p>
                      Use a suggested question below, or type your own. Responses use
                      aggregated HopeBridge data only.
                    </p>
                  </div>
                ) : null}
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`ai-message ${message.role}`}
                  >
                    <div className="ai-message-meta">
                      <span>
                        {message.role === "assistant" ? "HopeBridge AI" : "You"}
                      </span>
                      <time>{message.time}</time>
                    </div>
                    <MessageBody message={message} />
                  </article>
                ))}
                {sending ? (
                  <div className="ai-typing">
                    <Loader2 className="mr-2 inline animate-spin" size={14} />
                    Analyzing HopeBridge organizational data…
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>

              <div className="ai-chips" aria-label="Suggested questions">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className="ai-chip-btn"
                    disabled={sending || loading || !ctx}
                    onClick={() => void submitQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>

              {chatError ? (
                <div className="mx-5 mb-3 ai-error-banner" role="alert">
                  {chatError}
                </div>
              ) : null}

              <form className="ai-composer" onSubmit={onSubmit}>
                <div className="ai-composer-row">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Ask about campaigns, programs, beneficiaries, risks…"
                    disabled={sending}
                    rows={2}
                    aria-label="Ask HopeBridge AI"
                  />
                  <button
                    type="submit"
                    className="ia-gold-btn shrink-0"
                    disabled={sending || !input.trim() || !ctx}
                  >
                    {sending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    Send
                  </button>
                </div>
                <div className="ai-composer-actions">
                  <p className="text-xs text-[#607269]">
                    Deterministic HopeBridge intelligence engine · Enter to send ·
                    Shift+Enter for new line
                  </p>
                </div>
              </form>
            </section>

            {/* Right panel */}
            <aside className="ai-side-stack" aria-label="Intelligence panels">
              <section className="ia-panel" aria-label="Priority and risk">
                <div className="ia-panel-header">
                  <div>
                    <p className="ia-kicker">PRIORITY &amp; RISK</p>
                    <h2>Organizational Alerts</h2>
                    <p>Calculated from live campaigns, programs, and follow-ups.</p>
                  </div>
                </div>

                {loading && !ctx ? (
                  <div className="px-6 py-6 text-sm text-[#607269]">Loading alerts…</div>
                ) : risks.length === 0 ? (
                  <div className="px-6 py-6 text-sm text-[#607269]">
                    No campaigns currently meet the risk criteria, and no program or
                    follow-up alerts are flagged.
                  </div>
                ) : (
                  <div className="ia-risk">
                    {risks.map((risk) => (
                      <article key={risk.id} className="ia-risk-item">
                        <div>
                          <span className={`ia-severity ${risk.severity}`}>
                            {risk.severity}
                          </span>
                          <h3 className="mt-2">{risk.title}</h3>
                          <p>{risk.detail}</p>
                        </div>
                        <button
                          type="button"
                          className="ia-ghost-btn"
                          onClick={() => router.push(risk.href)}
                        >
                          {risk.actionLabel}
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="ia-panel" aria-label="Live organization snapshot">
                <div className="ia-panel-header">
                  <div>
                    <p className="ia-kicker">LIVE ORGANIZATION SNAPSHOT</p>
                    <h2>Current Metrics</h2>
                    <p>Compact metrics from HopeBridge operational modules.</p>
                  </div>
                </div>

                {loading && !ctx ? (
                  <div className="px-6 py-6 text-sm text-[#607269]">Loading metrics…</div>
                ) : ctx ? (
                  <div className="ai-metric-grid">
                    {ctx.liveMetrics.map((metric) => (
                      <div key={metric.id} className="ai-metric" title={metric.note}>
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                        {!metric.available && metric.note ? (
                          <em>{metric.note}</em>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-6 text-sm text-[#607269]">
                    Snapshot unavailable.
                  </div>
                )}
              </section>

              <section className="ia-panel" aria-label="Data coverage">
                <div className="ia-panel-header">
                  <div>
                    <p className="ia-kicker">DATA COVERAGE</p>
                    <h2>Connected HopeBridge Modules</h2>
                    <p>Coverage reflects actual records — not page existence.</p>
                  </div>
                </div>

                {loading && !ctx ? (
                  <div className="px-6 py-6 text-sm text-[#607269]">Checking coverage…</div>
                ) : ctx ? (
                  <div className="ai-coverage-list">
                    {ctx.coverage.map((item) => (
                      <div key={item.module} className="ai-coverage-row">
                        <Link href={item.href}>{item.module}</Link>
                        <div className="ai-coverage-meta">
                          <strong className={item.state}>
                            {coverageLabel(item.state)}
                          </strong>
                          <span>{item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            </aside>
          </div>

          {/* Quick Analysis Actions */}
          <section className="ia-panel" aria-label="Quick analysis actions">
            <div className="ia-panel-header">
              <div>
                <p className="ia-kicker">QUICK ANALYSIS</p>
                <h2>Nonprofit Intelligence Actions</h2>
                <p>
                  Each action submits a grounded question to the HopeBridge intelligence
                  engine.
                </p>
              </div>
              <Sparkles className="text-[#d4af37]" size={20} />
            </div>

            <div className="ai-quick-grid">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="ai-quick-btn"
                  disabled={sending || loading || !ctx}
                  onClick={() => void submitQuestion(action.question)}
                >
                  {action.id === "fundraising" ? (
                    <CircleDollarSign size={16} className="text-[#0d5f44]" />
                  ) : null}
                  {action.id === "programs" ? (
                    <Target size={16} className="text-[#0d5f44]" />
                  ) : null}
                  {action.id === "beneficiaries" ? (
                    <HandHeart size={16} className="text-[#0d5f44]" />
                  ) : null}
                  {action.id === "volunteers" ? (
                    <UsersRound size={16} className="text-[#0d5f44]" />
                  ) : null}
                  {action.id === "risks" ? (
                    <AlertTriangle size={16} className="text-[#0d5f44]" />
                  ) : null}
                  {action.id === "executive" ? (
                    <Megaphone size={16} className="text-[#0d5f44]" />
                  ) : null}
                  {action.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
