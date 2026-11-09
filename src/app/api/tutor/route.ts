import { jsonReply } from "@/lib/server/http";
import { createTutorHandler } from "@/lib/tutor/service";
import { openaiTutor } from "@/lib/tutor/openai-provider";

export const runtime = "nodejs";
export const maxDuration = 20;

// Configuration is not proof of a live provider connection and makes no API call.
export async function GET() {
  return jsonReply(openaiTutor.configuration());
}

export const POST = createTutorHandler(openaiTutor);
