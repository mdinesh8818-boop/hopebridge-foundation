import type {
  AiAssistantStatusResponse,
  AiChatResponse,
  AiChatTurn,
  HopeBridgeAiContextPayload,
} from "@/lib/ai/types";
import { parseAssistantSections } from "@/lib/ai/parseSections";
import { auth } from "@/app/lib/firebase";
import type { AiAnswer } from "./aiIntelligence";

export type AiChatClientResult =
  | {
      source: "llm";
      answer: AiAnswer;
      model: string;
    }
  | {
      source: "unconfigured";
      message: string;
    }
  | {
      source: "error";
      message: string;
      provider?: {
        httpStatus: number;
        code: string | null;
        type: string | null;
        param: string | null;
        detail: string;
        model: string;
      };
    };

async function getAuthorizationHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Your session has expired. Please sign in again.");
  }
  const idToken = await user.getIdToken();
  return {
    Authorization: `Bearer ${idToken}`,
  };
}

export async function fetchAiAssistantStatus(options?: {
  verify?: boolean;
}): Promise<AiAssistantStatusResponse> {
  const query = options?.verify ? "?verify=1" : "";
  const authHeaders = await getAuthorizationHeaders();
  const response = await fetch(`/api/ai-assistant/chat${query}`, {
    method: "GET",
    credentials: "same-origin",
    headers: authHeaders,
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      "Your HopeBridge account is not authorized for AI Assistant access.",
    );
  }

  if (!response.ok) {
    throw new Error("Unable to check AI Assistant configuration.");
  }

  return (await response.json()) as AiAssistantStatusResponse;
}

export async function requestHopeBridgeAiChat(input: {
  question: string;
  history: AiChatTurn[];
  context: HopeBridgeAiContextPayload;
}): Promise<AiChatClientResult> {
  const authHeaders = await getAuthorizationHeaders();
  const response = await fetch("/api/ai-assistant/chat", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      question: input.question,
      history: input.history,
      context: input.context,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      "Your HopeBridge account is not authorized for AI Assistant access.",
    );
  }

  const payload = (await response.json()) as AiChatResponse | { error?: string };

  if ("error" in payload && payload.error) {
    return {
      source: "error",
      message: payload.error,
    };
  }

  if (!("mode" in payload)) {
    return {
      source: "error",
      message: "Unexpected AI Assistant response.",
    };
  }

  if (payload.mode === "llm") {
    const sections = parseAssistantSections(payload.text);
    return {
      source: "llm",
      model: payload.model,
      answer: {
        text: payload.text,
        sections:
          sections ??
          ([
            {
              heading: "OBSERVATION",
              body: payload.text,
            },
          ] as AiAnswer["sections"]),
      },
    };
  }

  if (payload.mode === "unconfigured") {
    return {
      source: "unconfigured",
      message: payload.message,
    };
  }

  return {
    source: "error",
    message: payload.message,
    provider: payload.provider,
  };
}
