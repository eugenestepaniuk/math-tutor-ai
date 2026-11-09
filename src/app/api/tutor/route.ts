import { jsonReply } from "@/lib/server/http";
import { createTutorHandler } from "@/lib/tutor/service";
import { tutorConfiguration, tutorProvider } from "@/lib/tutor/provider";

export const runtime = "nodejs";
export const maxDuration = 20;

// Configuration is not proof of a live provider connection and makes no API call.
export async function GET() {
  return jsonReply(tutorConfiguration());
}

export const POST = createTutorHandler(tutorProvider);
