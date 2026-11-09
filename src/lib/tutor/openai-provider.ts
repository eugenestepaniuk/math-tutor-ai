import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { TutorReply } from "./contracts";
import { TutorProviderError, type TutorProvider } from "./service";
import { TUTOR_INSTRUCTIONS, tutorInput } from "./prompt";

export const openaiTutor: TutorProvider = {
  configuration() {
    return {
      enabled: process.env.TUTOR_ENABLED === "true",
      configured: !!process.env.OPENAI_API_KEY?.trim(),
    };
  },

  async generate(request, context, signal) {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) throw new TutorProviderError("not_configured");
    const client = new OpenAI({
      apiKey: key, baseURL: "https://api.openai.com/v1",
      timeout: 15_000, maxRetries: 0, logLevel: "off",
    });
    try {
      const response = await client.responses.parse({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-6-luna",
        instructions: TUTOR_INSTRUCTIONS,
        input: [{ role: "user", content: tutorInput(request, context) }],
        text: { format: zodTextFormat(TutorReply, "tutor_reply") },
        reasoning: { effort: "low" },
        max_output_tokens: 1200,
        store: false,
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
