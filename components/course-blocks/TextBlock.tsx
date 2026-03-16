"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import ListItem from "@tiptap/extension-list-item"
import BlockHeader from "./BlockHeader"

export default function TextBlock({
  block,
  updateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  dragListeners,
  dragAttributes,
}: {
  block: Record<string, unknown>
  updateBlock?: (blockId: string, updates: Record<string, unknown>) => void
  onDuplicateBlock?: (blockId: string) => void
  onDeleteBlock?: (blockId: string) => void
  dragListeners?: Record<string, unknown>
  dragAttributes?: Record<string, unknown>
}) {
  const blockId = block?.id as string

  const editor = useEditor({
    extensions: [
      StarterKit,
      ListItem,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: (block?.content as string) || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none text-gray-700 min-h-[120px]",
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML()
      if (blockId && updateBlock) {
        updateBlock(blockId, { content: html })
      }
    },
  })

  return (
    <div className="overflow-hidden">
      <BlockHeader
        icon="fa-align-left"
        color="bg-purple-500"
        label="Text"
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <div className="p-5">
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-3">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
            >
              <i className="fa-solid fa-bold text-xs"></i>
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
            >
              <i className="fa-solid fa-italic text-xs"></i>
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
            >
              <i className="fa-solid fa-list-ul text-xs"></i>
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
            >
              <i className="fa-solid fa-list-ol text-xs"></i>
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button
              type="button"
              onClick={() => {
                const previousUrl = editor?.getAttributes("link").href
                const url = window.prompt("Enter URL", previousUrl)

                if (url === null) return

                if (url === "") {
                  editor?.chain().focus().unsetLink().run()
                  return
                }

                editor?.chain().focus().setLink({ href: url }).run()
              }}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
            >
              <i className="fa-solid fa-link text-xs"></i>
            </button>
          </div>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
