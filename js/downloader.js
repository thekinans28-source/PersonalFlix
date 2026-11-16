import { saveVideo } from "./database.js";
import { createOPFSWriter } from "./storage.js";

// Streams each network chunk directly to OPFS: avoids holding the whole video in RAM.
// Requires an authorized direct URL, CORS permission, and a readable response body.
export async function downloadVideo(video, onProgress = () => {}, signal) {
  if (!video.url) throw new Error("Video belum memiliki URL langsung.");
  const response = await fetch(video.url, { mode: "cors", signal });
  if (!response.ok) throw new Error(`Sumber mengembalikan HTTP ${response.status}`);
  if (!response.body) throw new Error("Browser tidak menyediakan stream untuk sumber ini.");

  const total = Number(response.headers.get("content-length")) || 0;
  const type = response.headers.get("content-type") || "video/mp4";
  const fileName = `${video.id}.video`;
  const writer = await createOPFSWriter(fileName);
  const reader = response.body.getReader();
  let received = 0;
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException("Download dibatalkan.", "AbortError");
      const { done, value } = await reader.read();
      if (done) break;
      await writer.write(value);
      received += value.byteLength;
      onProgress({ received, total, percent: total ? Math.min(100, Math.round(received / total * 100)) : null });
    }
    await writer.close();
    await saveVideo({ ...video, offline: true, fileName, downloadedBytes: received, contentType: type });
    return fileName;
  } catch (error) {
    try { await reader.cancel(); } catch {}
    try { await writer.abort(); } catch {}
    throw error;
  }
}
