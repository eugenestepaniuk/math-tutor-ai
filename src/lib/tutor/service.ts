import { createHash } from "node:crypto";
import { jsonReply, readJsonBody, RequestError, requireJsonRequest } from "@/lib/server/http";
import { TutorRequest, TutorResponse, type TutorErrorCode } from "./contracts";
import { teachingContext, safeTutorReply, tutorReplyIssue, type TeachingContext } from "./policy";
import { createTutorLimit } from "./limits";

export class TutorProviderError extends Error {
  constructor(public readonly code: TutorErrorCode) { super(code); }
}

export type TutorProvider = {
  configuration: () => { enabled: boolean; configured: boolean };
  generate: (request: TutorRequest, context: TeachingContext, signal: AbortSignal) => Promise<unknown>;
};

const ERROR_MESSAGES: Record<TutorErrorCode, string> = {
  disabled: "AI tutoring is unavailable. You can still check your algebra steps.",
  not_configured: "The AI service is not ready. Your checked work is still available.",
  timeout: "The tutor took too long to respond. Your message is still here; please try again.",
  provider_limit: "The AI service is temporarily at its limit. Please wait before trying again.",
  provider_error: "The AI tutor couldn’t respond. Your work is still here; please try again.",
  invalid_guidance: "The AI guidance did not pass verification. Use the checked feedback and rule reminder, or try again.",
  request_limit: "The tutor is busy. Please wait a moment before trying again.",
};

function unavailable(context: TeachingContext, code: TutorErrorCode): TutorResponse {
  return {
    result: context.result, state: context.state,
    tutor: {
      status: "unavailable", source: null, message: ERROR_MESSAGES[code],
      guidingQuestion: null, mathExample: null, errorCode: code,
      retryable: code !== "disabled" && code !== "not_configured",
    },
  };
}

export function createTutorHandler(provider: TutorProvider, now: () => number = Date.now) {
  const limit = createTutorLimit(now);
  const cache = new Map<string, { hash: string; expires: number; promise: Promise<TutorResponse> }>();

  async function generate(data: TutorRequest, context: TeachingContext, signal: AbortSignal): Promise<TutorResponse> {
    if (signal.aborted) return unavailable(context, "timeout");
    const release = limit.acquire();
    if (!release) return unavailable(context, "request_limit");
    const timeout = AbortSignal.timeout(15_000);
    const combined = AbortSignal.any([signal, timeout]);
    let onAbort: () => void = () => {};
    const canceled = new Promise<never>((_resolve, reject) => {
      onAbort = () => reject(new TutorProviderError("timeout"));
      combined.addEventListener("abort", onAbort, { once: true });
    });
    try {
      const value = await Promise.race([provider.generate(data, context, combined), canceled]);
      const reply = safeTutorReply(value, context);
      if (!reply) {
        // Fixed policy reason only: never log student text, model prose or SDK errors.
        console.warn("Tutor guidance rejected:", tutorReplyIssue(value, context));
        const fallback = unavailable(context, "invalid_guidance");
        return { ...fallback, tutor: { ...fallback.tutor, status: "guarded", source: "checker" } };
      }
      return {
        result: context.result, state: context.state,
        tutor: {
          status: "ready", source: "model", message: reply.message,
          guidingQuestion: reply.guidingQuestion, mathExample: context.example,
          errorCode: null, retryable: false,
        },
      };
    } catch (error) {
      const code = timeout.aborted || signal.aborted ? "timeout"
        : error instanceof TutorProviderError ? error.code : "provider_error";
      return unavailable(context, code);
    } finally { combined.removeEventListener("abort", onAbort); release(); }
  }

  return async function POST(request: Request): Promise<Response> {
    try {
      requireJsonRequest(request);
      const body = await readJsonBody(request, 65_536);
      const parsed = TutorRequest.safeParse(body);
      if (!parsed.success) throw new RequestError(400, "The tutor request could not be read. Keep messages short and start again if the session is full.");
      const data = parsed.data;
      const context = teachingContext(data);
      const configuration = provider.configuration();
      if (!configuration.enabled) return jsonReply(unavailable(context, "disabled"));
      if (!configuration.configured) return jsonReply(unavailable(context, "not_configured"));
      for (const [key, entry] of cache) if (entry.expires <= now()) cache.delete(key);
      const hash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
      const existing = cache.get(data.action.id);
      if (existing && existing.hash !== hash) throw new RequestError(409, "Retry the same request or send a new message.");
      if (existing) return jsonReply(TutorResponse.parse(await existing.promise));
      if (cache.size >= 128) cache.delete(cache.keys().next().value!);
      const promise = generate(data, context, request.signal);
      cache.set(data.action.id, { hash, expires: now() + 120_000, promise });
      const result = await promise;
      if (result.tutor.status !== "ready") cache.delete(data.action.id);
      return jsonReply(TutorResponse.parse(result));
    } catch (error) {
      return error instanceof RequestError
        ? jsonReply({ error: error.message }, error.status)
        : jsonReply({ error: "The tutor request couldn’t finish. Your work is still here; please try again." }, 500);
    }
  };
}
