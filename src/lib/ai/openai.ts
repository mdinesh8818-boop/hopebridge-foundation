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
  };
};

export async function generateOpenAiAssistantReply(
  systemPrompt: string,
  history: AiChatTurn[],
  question: string,
): Promise<string> {
  const { apiKey, model } = getAiProviderConfig();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    { role: "user" as const, content: question },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

  const payload = (await response.json()) as ChatCompletionResponse;

  if (!response.ok) {
    const providerMessage =
      payload.error?.message || `OpenAI request failed (${response.status})`;
    throw new Error(providerMessage);
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenAI returned an empty response");
  }

  return text;
}
