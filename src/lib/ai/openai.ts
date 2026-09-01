import type { AiChatTurn } from "./types";
import { getAiProviderConfig } from "./config";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string | number | null;
    param?: string | null;
  };
};

export class OpenAiProviderError extends Error {
  readonly httpStatus: number;
  readonly providerType: string | null;
  readonly providerCode: string | null;
  readonly providerParam: string | null;

  constructor(input: {
    message: string;
    httpStatus: number;
    providerType?: string | null;
    providerCode?: string | number | null;
    providerParam?: string | null;
  }) {
    super(input.message);
    this.name = "OpenAiProviderError";
    this.httpStatus = input.httpStatus;
    this.providerType = input.providerType ?? null;
    this.providerCode =
      input.providerCode == null ? null : String(input.providerCode);
    this.providerParam = input.providerParam ?? null;
  }
}

function redactSecrets(value: string): string {
  return value
    .replace(/sk-[A-Za-z0-9_-]+/g, "[REDACTED_API_KEY]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]");
}

export async function generateOpenAiAssistantReply(
  systemPrompt: string,
  history: AiChatTurn[],
  question: string,
): Promise<string> {
  const { apiKey, model } = getAiProviderConfig();

  if (!apiKey) {
    throw new OpenAiProviderError({
      message: "OPENAI_API_KEY is not configured",
      httpStatus: 0,
      providerCode: "missing_api_key",
      providerType: "configuration_error",
    });
  }

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    { role: "user" as const, content: question },
  ];

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1200,
        messages,
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network request to OpenAI failed";
    throw new OpenAiProviderError({
      message: redactSecrets(message),
      httpStatus: 0,
      providerCode: "network_error",
      providerType: "network_error",
    });
  }

  let payload: ChatCompletionResponse;
  try {
    payload = (await response.json()) as ChatCompletionResponse;
  } catch {
    throw new OpenAiProviderError({
      message: `OpenAI returned a non-JSON response (${response.status})`,
      httpStatus: response.status,
      providerCode: "invalid_json_response",
      providerType: "api_error",
    });
  }

  if (!response.ok) {
    const providerMessage = redactSecrets(
      payload.error?.message || `OpenAI request failed (${response.status})`,
    );
    throw new OpenAiProviderError({
      message: providerMessage,
      httpStatus: response.status,
      providerType: payload.error?.type ?? "api_error",
      providerCode: payload.error?.code ?? `http_${response.status}`,
      providerParam:
        typeof payload.error?.param === "string" ? payload.error.param : null,
    });
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new OpenAiProviderError({
      message: "OpenAI returned an empty response",
      httpStatus: response.status,
      providerCode: "empty_response",
      providerType: "api_error",
    });
  }

  return text;
}

/** Lightweight runtime probe — does not log secrets or full responses. */
export async function probeOpenAiProvider(): Promise<{
  ok: boolean;
  detail: string;
  httpStatus?: number;
  code?: string | null;
}> {
  const { apiKey, model } = getAiProviderConfig();

  if (!apiKey) {
    return { ok: false, detail: "Provider not configured" };
  }

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        temperature: 0,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network request to OpenAI failed";
    return {
      ok: false,
      detail: redactSecrets(message),
      code: "network_error",
    };
  }

  if (!response.ok) {
    let payload: ChatCompletionResponse = {};
    try {
      payload = (await response.json()) as ChatCompletionResponse;
    } catch {
      // ignore parse errors for probe
    }
    return {
      ok: false,
      detail: redactSecrets(
        payload.error?.message || `OpenAI probe failed (${response.status})`,
      ),
      httpStatus: response.status,
      code:
        payload.error?.code == null ? `http_${response.status}` : String(payload.error.code),
    };
  }

  return { ok: true, detail: "Provider responded successfully" };
}
