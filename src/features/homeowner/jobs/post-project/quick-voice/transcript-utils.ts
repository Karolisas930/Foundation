/**
 * Small transcript/blob helpers shared by the voice intake pipeline.
 */

/**
 * Remove duplicate consecutive sentences and repeated phrases that often
 * appear in streaming STT output. Keeps the first occurrence and tidies
 * whitespace so the final transcript reads naturally.
 */
export function dedupeTranscript(raw: string): string {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]?/g) ?? [text];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sentences) {
    const norm = s
      .trim()
      .toLowerCase()
      .replace(/[.!?,;:]+$/g, "");
    if (!norm) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(s.trim());
  }
  return out
    .join(" ")
    .replace(/\s+([.!?,;:])/g, "$1")
    .trim();
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function extFromMime(mimeType: string): string {
  return mimeType.includes("mp4")
    ? "mp4"
    : mimeType.includes("mpeg")
      ? "mp3"
      : mimeType.includes("wav")
        ? "wav"
        : "webm";
}
