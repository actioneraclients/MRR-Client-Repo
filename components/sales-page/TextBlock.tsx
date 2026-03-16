export function TextBlock({ text, className }: { text?: string | null; className?: string }) {
  if (!text) return null

  return (
    <div className={`whitespace-pre-line leading-relaxed text-slate-600 ${className ?? ""}`}>
      {text}
    </div>
  )
}
