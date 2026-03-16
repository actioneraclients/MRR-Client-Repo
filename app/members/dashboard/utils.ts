export function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url?.trim()) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

export function isYouTubeUrl(url: string | null): boolean {
  if (!url?.trim()) return false
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/.test(url)
}
