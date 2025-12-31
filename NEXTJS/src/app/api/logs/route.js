import { addClient, removeClient } from "@/lib/logger";

export async function GET(req) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const res = {
        write(chunk) {
          controller.enqueue(encoder.encode(chunk));
        }
      };

      addClient(res);

      controller.enqueue(
        encoder.encode("data: {\"message\":\"🟢 Log stream connected\"}\n\n")
      );

      req.signal.addEventListener("abort", () => {
        removeClient(res);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
