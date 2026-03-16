/**
 * Parses hero_video_url and returns embed info for YouTube/Vimeo or direct MP4 src.
 * Returns null if URL is empty or parsing fails (caller should fallback to image).
 */
export function getHeroVideoDisplay(
  url: string | null | undefined,
): { kind: "iframe"; src: string } | { kind: "video"; src: string } | null {
  if (url == null || typeof url !== "string") return null
  const trimmed = url.trim()
  if (trimmed === "") return null
  try {
    const lower = trimmed.toLowerCase()
    const youtuBeMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
    if (youtuBeMatch) return { kind: "iframe", src: `https://www.youtube.com/embed/${youtuBeMatch[1]}` }
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
    if (watchMatch) return { kind: "iframe", src: `https://www.youtube.com/embed/${watchMatch[1]}` }
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (vimeoMatch) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeoMatch[1]}` }
    if (lower.endsWith(".mp4")) return { kind: "video", src: trimmed }
    return null
  } catch {
    return null
  }
}
