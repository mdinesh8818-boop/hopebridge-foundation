import type {
  AiAnswerSection,
  AiAnswerSectionHeading,
} from "@/services/aiIntelligence";

const SECTION_HEADINGS: AiAnswerSectionHeading[] = [
  "FACT",
  "OBSERVATION",
  "WHY IT MATTERS",
  "AI RECOMMENDATION",
  "RECOMMENDED ACTION",
  "DATA CONSIDERED",
];

export function parseAssistantSections(text: string): AiAnswerSection[] | undefined {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return undefined;

  const pattern = new RegExp(
    `(?:^|\\n)(${SECTION_HEADINGS.join("|")})\\s*\\n`,
    "g",
  );

  const matches = [...normalized.matchAll(pattern)];
  if (matches.length === 0) return undefined;

  const sections: AiAnswerSection[] = [];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const heading = match[1] as AiAnswerSectionHeading;
    const start = (match.index ?? 0) + match[0].length;
    const end =
      index + 1 < matches.length
        ? (matches[index + 1].index ?? normalized.length)
        : normalized.length;
    const body = normalized.slice(start, end).trim();

    if (body) {
      sections.push({ heading, body });
    }
  }

  return sections.length > 0 ? sections : undefined;
}
