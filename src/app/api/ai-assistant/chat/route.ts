import { NextResponse } from "next/server";

import { isHopeBridgeSessionAuthenticated } from "@/lib/ai/auth";
import { getAiProviderConfig } from "@/lib/ai/config";
import {
  generateOpenAiAssistantReply,
  OpenAiProviderError,
  probeOpenAiProvider,
} from "@/lib/ai/openai";
import { buildHopeBridgeSystemPrompt } from "@/lib/ai/prompt";
import type {
  AiAssistantStatusResponse,
  AiChatRequestBody,
  AiChatResponse,
  AiChatTurn,
} from "@/lib/ai/types";

const MAX_HISTORY_TURNS = 16;
const MAX_QUESTION_LENGTH = 2000;
const MAX_TURN_LENGTH = 4000;

function sanitizeHistory(history: unknown): AiChatTurn[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (turn): turn is AiChatTurn =>
        typeof turn === "object" &&
        turn !== null &&
        (turn.role === "user" || turn.role === "assistant") &&
        typeof turn.content === "string",
    )
    .map((turn) => ({
      role: turn.role,
      content: turn.content.trim().slice(0, MAX_TURN_LENGTH),
    }))
    .filter((turn) => turn.content.length > 0)
    .slice(-MAX_HISTORY_TURNS);
}

export async function GET(request: Request) {
  if (!(await isHopeBridgeSessionAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getAiProviderConfig();
  const verify = new URL(request.url).searchParams.get("verify") === "1";

  const body: AiAssistantStatusResponse = {
    configured: config.configured,
    provider: config.provider,
    model: config.configured ? config.model : undefined,
  };

  if (verify && config.configured) {
    const probe = await probeOpenAiProvider();
    body.verified = probe.ok;
    body.verificationDetail = probe.detail;
    body.verificationCode = probe.code ?? null;
    body.verificationHttpStatus = probe.httpStatus;
  }

  return NextResponse.json(body);
}

export async function POST(request: Request) {
  if (!(await isHopeBridgeSessionAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: AiChatRequestBody;

  try {
    payload = (await request.json()) as AiChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const question = payload.question?.trim().slice(0, MAX_QUESTION_LENGTH) ?? "";
  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  if (!payload.context || typeof payload.context !== "object") {
    return NextResponse.json(
      { error: "Organizational context is required" },
      { status: 400 },
    );
  }

  const config = getAiProviderConfig();
  if (!config.configured) {
    const response: AiChatResponse = {
      mode: "unconfigured",
      message:
        "Conversational AI is not configured yet. Add OPENAI_API_KEY on the server to enable LLM responses.",
    };
    return NextResponse.json(response, { status: 503 });
  }

  const history = sanitizeHistory(payload.history);

  try {
    const systemPrompt = buildHopeBridgeSystemPrompt(payload.context);
    const text = await generateOpenAiAssistantReply(
      systemPrompt,
      history,
      question,
    );

    const response: AiChatResponse = {
      mode: "llm",
      text,
      model: config.model,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("HopeBridge AI Assistant provider error:", error);

    const provider =
      error instanceof OpenAiProviderError
        ? {
            httpStatus: error.httpStatus,
            code: error.providerCode,
            type: error.providerType,
            param: error.providerParam,
            detail: error.message,
            model: config.model,
          }
        : {
            httpStatus: 0,
            code: "unknown_provider_error",
            type: "unknown",
            param: null,
            detail:
              error instanceof Error
                ? error.message.replace(/sk-[A-Za-z0-9_-]+/g, "[REDACTED_API_KEY]")
                : "Unknown provider error",
            model: config.model,
          };

    const response: AiChatResponse = {
      mode: "error",
      message:
        "The AI provider is temporarily unavailable. Please try again in a moment.",
      provider,
    };

    return NextResponse.json(response, { status: 502 });
  }
}
