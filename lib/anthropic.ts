import Anthropic from "@anthropic-ai/sdk";

// Default to Sonnet 4.6 — latest production-grade model as of the plan date.
// Upgrade here in one place when a new model ships.
export const CHAT_MODEL = "claude-sonnet-4-6";
export const SUMMARY_MODEL = "claude-sonnet-4-6";

export const MAX_CHAT_TOKENS = 1024;
export const MAX_SUMMARY_TOKENS = 1024;

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env to use chat endpoints.",
    );
  }
  client = new Anthropic({ apiKey });
  return client;
}
