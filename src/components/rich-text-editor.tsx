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
import { Math } from '@/lib/tiptap-math';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon, List, Sigma } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MathFormulaButton } from './math-formula-button';
import katex from 'katex';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  minimal?: boolean;
  showMath?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
  editable = true,
  minimal = false,
  showMath = false,
}: RichTextEditorProps) {
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
      Math,
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
    content,
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
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Render math formulas in the content
  useEffect(() => {
    if (!editor) return;

    const renderMath = () => {
      const elements = document.querySelectorAll('.math-formula[data-latex]');
      elements.forEach((element) => {
        const latex = element.getAttribute('data-latex');
        if (latex) {
          try {
            const html = katex.renderToString(latex, {
              throwOnError: false,
              displayMode: false,
            });
            element.innerHTML = html;
          } catch (e) {
            element.textContent = latex;
          }
        }
      });
    };

    renderMath();
    editor.on('update', renderMath);

    return () => {
      editor.off('update', renderMath);
    };
  }, [editor]);

  const handleMathInsert = (latex: string) => {
    if (!editor) return;
    
    // Insert inline math
    const html = `<span class="math-formula" data-latex="${latex}"></span>&nbsp;`;
    editor.chain().focus().insertContent(html).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {editable && !minimal && editor.isActive && (
        <div className="border-b bg-muted/30 p-2 flex gap-1 flex-wrap">
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
          
          {showMath && (
            <div className="ml-1">
              <MathFormulaButton onInsert={handleMathInsert} />
            </div>
          )}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

