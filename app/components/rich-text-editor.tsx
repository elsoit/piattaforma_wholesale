'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'
import { useEffect, useState } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  // Stato per il mounting
  const [isMounted, setIsMounted] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[100px] focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Gestisci il mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Non renderizzare nulla durante il server-side rendering
  if (!isMounted) {
    return (
      <div className="border rounded-md">
        <div className="border-b bg-muted p-1 flex gap-1">
          {/* Placeholder per i bottoni */}
          <div className="h-8 w-8" />
          <div className="h-8 w-8" />
          <div className="h-8 w-8" />
          <div className="h-8 w-8" />
        </div>
        <div className="p-3 min-h-[100px]" />
      </div>
    )
  }

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-md">
      <div className="border-b bg-muted p-1 flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleBold().run()
          }}
          className={editor.isActive('bold') ? 'bg-muted-foreground/20' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleItalic().run()
          }}
          className={editor.isActive('italic') ? 'bg-muted-foreground/20' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleBulletList().run()
          }}
          className={editor.isActive('bulletList') ? 'bg-muted-foreground/20' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleOrderedList().run()
          }}
          className={editor.isActive('orderedList') ? 'bg-muted-foreground/20' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="p-3" />
    </div>
  )
} 