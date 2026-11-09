export class RequestError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export const jsonReply = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export function requireJsonRequest(request: Request) {
  const expected = new URL(request.url);
  const host = request.headers.get("host");
  if (host) expected.host = host;
  const origin = request.headers.get("origin");
  if (origin && origin !== expected.origin) throw new RequestError(403, "Use this service from the learning workspace.");
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    throw new RequestError(415, "Send an application/json request.");
  }
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  if (!request.body) throw new RequestError(400, "Send a valid JSON request.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestError(413, "That request is too large.");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new RequestError(400, "Send a valid JSON request."); }
}
