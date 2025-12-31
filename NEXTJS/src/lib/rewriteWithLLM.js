import { GoogleGenAI } from "@google/genai";
import { sendLog } from "./logger";

const ai = new GoogleGenAI({});

// Ordered by preference
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3-flash"
];

// helper sleep
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function rewriteWithLLM(originalHtml, referenceHtmls) {
  sendLog("🧠 rewriteWithLLM: started");

  const Original = originalHtml.slice(0, 12000);
  const Refs = referenceHtmls
    .map((html, i) => {
      sendLog(`📄 Reference HTML [${i}] length: ${html.length}`);
      return html.slice(0, 12000);
    })
    .join("\n\n");

  const prompt = `
You are given raw HTML from multiple web pages.

TASK:
1 Identify and extract the main article content.
2 Ignore navigation, ads, sidebars, footers, and unrelated sections.
3 Rewrite the original article and make its formatting & content similar (with updated SEO keywords or new info acquired from reference articles).
4 Use ONLY these tags: h2, h3, p, ul, ol, li.
5 Do NOT include styles, scripts, branding, headers, or footers.
6 Output ONLY valid rewritten HTML. No explanations.

ORIGINAL ARTICLE HTML:
${Original}

REFERENCE ARTICLE HTML:
${Refs}
`;

  for (const model of MODELS) {
    try {
      sendLog(`🤖 Trying model: ${model}`);

      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });

      const output = response?.text?.trim();

      if (!output) {
        sendLog(`⚠️ ${model} returned empty response`);
        continue;
      }

      sendLog(`✅ Rewrite successful using ${model} (length ${output.length})`);
      return output;

    } catch (err) {
      const msg = err?.message || "";
      const isRateLimit =
        err?.code === 429 ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("quota");

      if (isRateLimit) {
        // Try to extract retry delay (Gemini gives seconds sometimes)
        let retryMs = 0;

        try {
          const retryInfo = err?.details?.find(
            (d) => d["@type"]?.includes("RetryInfo")
          );
          if (retryInfo?.retryDelay) {
            retryMs = parseInt(retryInfo.retryDelay.replace("s", ""), 10) * 1000;
          }
        } catch {}

        sendLog(
          `🚫 Rate limit hit on ${model}. ${
            retryMs ? `Retry suggested in ${retryMs / 1000}s.` : "Switching model."
          }`
        );

        if (retryMs) {
          await sleep(retryMs);
        }

        // move to next model
        continue;
      }

      // Non-rate-limit error → fatal
      sendLog(`🔥 ${model} failed: ${msg}`);
      break;
    }
  }

  sendLog("❌ All LLM models failed. Skipping rewrite.");
  return "";
}
