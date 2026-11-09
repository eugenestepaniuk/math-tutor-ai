import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { TutorReply } from "./contracts";
import { TutorProviderError, type TutorProvider } from "./service";
import { TUTOR_INSTRUCTIONS, tutorInput } from "./prompt";

// Both models support strict Structured Outputs on Groq's Free plan.
const MODELS = new Set(["openai/gpt-oss-20b", "openai/gpt-oss-120b"]);
export const groqModel = () => process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
export const publicGroqModel = () => MODELS.has(groqModel()) ? groqModel() : null;

export const groqTutor: TutorProvider = {
  configuration() {
    return {
      enabled: process.env.TUTOR_ENABLED === "true" && process.env.GROQ_FREE_TIER_CONFIRMED === "true",
      configured: !!process.env.GROQ_API_KEY?.trim() && MODELS.has(groqModel()),
    };
  },

  async generate(request, context, signal) {
    if (process.env.GROQ_FREE_TIER_CONFIRMED !== "true") throw new TutorProviderError("disabled");
    const key = process.env.GROQ_API_KEY?.trim();
    if (!key || !MODELS.has(groqModel())) throw new TutorProviderError("not_configured");
    const client = new OpenAI({
      apiKey: key, baseURL: "https://api.groq.com/openai/v1",
      timeout: 15_000, maxRetries: 0, logLevel: "off",
    });
    try {
      const response = await client.responses.parse({
        model: groqModel(),
        instructions: TUTOR_INSTRUCTIONS,
        input: [{ role: "user", content: tutorInput(request, context) }],
        text: { format: zodTextFormat(TutorReply.extend({
          hintLevel: z.literal(context.state.hintLevel),
          mathFocus: z.literal(context.example ? "worked_example" : "none"),
          suggestedNextAction: z.literal(context.nextAction),
        }), "tutor_reply") },
        reasoning: { effort: "low" },
        max_output_tokens: 1200,
        // Groq does not accept the Responses API's store parameter.
      }, { signal });
      if (response.status !== "completed" || !response.output_parsed) throw new TutorProviderError("provider_error");
      return response.output_parsed;
    } catch (error) {
      if (error instanceof TutorProviderError) throw error;
      if (error instanceof OpenAI.APIConnectionTimeoutError || signal.aborted) throw new TutorProviderError("timeout");
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) throw new TutorProviderError("provider_limit");
        if ([400, 401, 403, 404].includes(error.status ?? 0)) throw new TutorProviderError("not_configured");
      }
      throw new TutorProviderError("provider_error");
    }
  },
};
