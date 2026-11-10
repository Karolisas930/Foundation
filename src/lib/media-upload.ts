/** Browser helper: upload attachments to R2 via /api/public/media. */
export async function uploadMedia(files: (File | Blob)[]): Promise<string[]> {
  const keys: string[] = [];
  for (const f of files) {
    const fd = new FormData();
    const name = f instanceof File ? f.name : `voice-${Date.now()}.webm`;
    fd.append("file", f, name);
    const res = await fetch("/api/public/media", { method: "POST", body: fd });
    const json = (await res.json().catch(() => ({}))) as { key?: string; error?: string };
    if (!res.ok || !json.key) throw new Error(json.error ?? `upload failed (${res.status})`);
    keys.push(json.key);
  }
  return keys;
}

export const mediaUrl = (key: string) => `/api/public/media?key=${encodeURIComponent(key)}`;
