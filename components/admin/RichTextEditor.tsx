"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect } from "react"

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[400px] border rounded-md p-4 prose max-w-none focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>")
    }
  }, [editor, value])

  if (!editor) return null

  return (
    <div className="space-y-2">
      <EditorContent editor={editor} />
    </div>
  )
}
