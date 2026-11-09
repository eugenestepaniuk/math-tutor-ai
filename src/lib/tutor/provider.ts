import "server-only";
import { groqTutor, publicGroqModel } from "./groq-provider";
import { openaiTutor } from "./openai-provider";
import { TutorProviderError, type TutorProvider } from "./service";

export function tutorConfiguration() {
  const name = process.env.TUTOR_PROVIDER?.trim() || "groq";
  const provider = name === "groq" || name === "openai" ? name : null;
  const freeTierConfirmed = process.env.GROQ_FREE_TIER_CONFIRMED === "true";
  const paidAllowed = process.env.TUTOR_ALLOW_PAID === "true";
  const adapter = provider === "groq" ? groqTutor : provider === "openai" ? openaiTutor : null;
  const configuration = adapter?.configuration() ?? { enabled: false, configured: false };
  return {
    ...configuration,
    enabled: configuration.enabled && (provider !== "openai" || paidAllowed),
    provider, model: provider === "groq" ? publicGroqModel() : null,
    freeTierConfirmed: provider === "groq" && freeTierConfirmed,
    paidAllowed: provider === "openai" && paidAllowed,
  };
}

// Provider choice is server-owned. Never fall back to a different key or endpoint.
export const tutorProvider: TutorProvider = {
  configuration: tutorConfiguration,
  async generate(request, context, signal) {
    const configuration = tutorConfiguration();
    if (!configuration.provider || !configuration.configured) throw new TutorProviderError("not_configured");
    if (!configuration.enabled) throw new TutorProviderError("disabled");
    const adapter = configuration.provider === "groq" ? groqTutor : openaiTutor;
    return adapter.generate(request, context, signal);
  },
};
