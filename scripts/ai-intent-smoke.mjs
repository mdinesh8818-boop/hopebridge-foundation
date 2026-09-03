#!/usr/bin/env node
/**
 * Smoke checks for HopeBridge AI general-vs-organizational intent routing.
 * Mirrors production rules in src/services/aiIntelligence.ts.
 */
const ORG_SCOPE_MARKERS = [
  "hopebridge",
  "our campaign",
  "our program",
  "our donor",
  "our volunteer",
  "our beneficiar",
  "our fundrais",
  "our team",
  "our organization",
  "our organisation",
  "which campaign",
  "which program",
  "how many",
  "currently serving",
  "need attention",
  "at risk",
  "leadership priorit",
  "executive summary",
  "impact analytics",
  "funds raised",
  "analyze fundraising",
  "review program",
  "summarize volunteer",
  "summarize our",
  "organization summary",
];

const ORG_TOPIC_WORDS = [
  "campaign",
  "program",
  "donor",
  "donation",
  "volunteer",
  "beneficiar",
  "fundrais",
  "team",
  "leadership",
  "organization",
  "organisation",
];

function isDefinitionalQuestion(question) {
  const q = question.toLowerCase().trim();
  return (
    /^(what is|what's|whats|what are|explain|define|describe)\b/.test(q) ||
    /\b(what is|what's|explain|define)\b/.test(q)
  );
}

function looksOrganizational(question) {
  const q = question.toLowerCase();
  if (isDefinitionalQuestion(q)) {
    return (
      q.includes("hopebridge") ||
      q.includes("our ") ||
      q.includes("we ") ||
      ORG_SCOPE_MARKERS.some((marker) => q.includes(marker))
    );
  }
  if (ORG_SCOPE_MARKERS.some((marker) => q.includes(marker))) return true;
  const hasTopic = ORG_TOPIC_WORDS.some((word) => q.includes(word));
  if (!hasTopic) return false;
  return (
    q.includes("our ") ||
    q.includes("we ") ||
    q.includes("hopebridge") ||
    q.includes("summarize") ||
    q.includes("overview") ||
    q.includes("attention") ||
    q.includes("priorit") ||
    q.includes("performance") ||
    q.includes("risk") ||
    q.includes("health") ||
    q.includes("how many") ||
    q.includes("status")
  );
}

const cases = [
  ["What is ChatGPT?", false],
  ["Explain nonprofit fundraising.", false],
  ["What is donor retention?", false],
  ["Which campaigns need attention?", true],
  ["Summarize our fundraising performance.", true],
  ["What should leadership prioritize?", true],
  ["How many beneficiaries are we currently serving?", true],
];

let failed = 0;
for (const [question, expectedOrg] of cases) {
  const actual = looksOrganizational(question);
  if (actual !== expectedOrg) {
    console.error(`FAIL: "${question}" expected org=${expectedOrg} got ${actual}`);
    failed += 1;
  } else {
    console.log(`PASS: "${question}" -> org=${actual}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`AI intent smoke check passed (${cases.length} cases).`);
