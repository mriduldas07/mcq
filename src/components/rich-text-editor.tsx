"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import { MathLive } from '@/lib/tiptap-mathlive';
import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon, List, Sigma } from 'lucide-react';
import { Button } from '@/components/ui/button';
import katex from 'katex';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  minimal?: boolean;
  showMath?: boolean;
  editorRef?: (editor: any) => void;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
  editable = true,
  minimal = false,
  showMath = false,
  editorRef,
}: RichTextEditorProps) {
  // Sanitize content once to remove any inner content from math formulas
  const sanitizedContent = useMemo(() => {
    return content.replace(
      /<span([^>]*data-latex="[^"]*"[^>]*)>.*?<\/span>/gi,
      '<span$1></span>'
    );
  }, [content]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        blockquote: false,
      }),
      Bold,
      Italic,
      Underline,
      BulletList,
      ListItem,
      MathLive,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: sanitizedContent,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none min-h-[60px] px-3 py-2',
          !editable && 'cursor-default',
          className
        ),
      },
    },
  });

  useEffect(() => {
    if (editor && sanitizedContent !== editor.getHTML()) {
      editor.commands.setContent(sanitizedContent);
    }
  }, [sanitizedContent, editor]);

  useEffect(() => {
    if (editor && editorRef) {
      editorRef(editor);
    }
  }, [editor, editorRef]);

  const handleInsertEquation = () => {
    if (!editor) return;
    editor.chain().focus().insertMathLive().run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {editable && editor.isActive && (
        <div className="border-b bg-muted/30 p-2 flex gap-1 flex-wrap">
          {!minimal && (
            <>
              <Button
                type="button"
                variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className="h-8 px-2"
              >
                <BoldIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className="h-8 px-2"
              >
                <ItalicIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className="h-8 px-2"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="h-8 px-2"
              >
                <List className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {showMath && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleInsertEquation}
              className="h-8 px-2 gap-1"
            >
              <Sigma className="h-4 w-4" />
              <span className="text-xs">Equation</span>
            </Button>
          )}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

