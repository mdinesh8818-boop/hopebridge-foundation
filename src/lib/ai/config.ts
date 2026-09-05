export type AiProviderConfig = {
  configured: boolean;
  apiKey?: string;
  model: string;
  provider: "openai";
};

export function getAiProviderConfig(): AiProviderConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  return {
    provider: "openai",
    configured: Boolean(apiKey),
    apiKey,
    model,
  };
}
