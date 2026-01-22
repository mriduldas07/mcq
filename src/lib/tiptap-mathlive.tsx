import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { MathLiveEditor } from '@/components/mathlive-editor';
import { useEffect, useState } from 'react';
import katex from 'katex';

// Escape HTML to prevent XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface MathLiveOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathLive: {
      insertMathLive: (latex?: string) => ReturnType;
    };
  }
}

// React component for rendering math in edit/view mode
const MathLiveComponent = ({ node, updateAttributes, deleteNode, editor }: any) => {
  const [isEditing, setIsEditing] = useState(!node.attrs.latex);
  const [renderedHTML, setRenderedHTML] = useState('');

  const latex = node.attrs.latex || '';

  useEffect(() => {
    if (!isEditing && latex) {
      try {
        const html = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
        });
        setRenderedHTML(html);
      } catch (e) {
        console.warn('KaTeX rendering error:', e);
        setRenderedHTML(escapeHtml(latex));
      }
    }
  }, [latex, isEditing]);

  const handleInsert = (newLatex: string) => {
    if (newLatex && newLatex.trim()) {
      updateAttributes({ latex: newLatex });
      setIsEditing(false);
    } else {
      // If empty latex, remove the node
      deleteNode();
    }
  };

  const handleCancel = () => {
    if (!latex || !latex.trim()) {
      // If no latex exists, remove the node
      deleteNode();
    } else {
      setIsEditing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing && editor.isEditable) {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  if (isEditing && editor.isEditable) {
    return (
      <NodeViewWrapper as="span" className="math-live-wrapper">
        <MathLiveEditor
          initialValue={latex}
          onInsert={handleInsert}
          onCancel={handleCancel}
          inline={true}
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span" className="math-live-wrapper">
      <span
        className="math-formula-rendered inline-block px-1 py-0.5 mx-0.5 rounded cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: renderedHTML }}
        data-latex={latex}
      />
    </NodeViewWrapper>
  );
};

export const MathLive = Node.create<MathLiveOptions>({
  name: 'mathLive',
  
  inline: true,
  group: 'inline',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      latex: {
        default: null,
        parseHTML: element => element.getAttribute('data-latex'),
        renderHTML: attributes => {
          if (!attributes.latex) {
            return {};
          }
          return {
            'data-latex': attributes.latex,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-latex]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            latex: element.getAttribute('data-latex'),
          };
        },
      },
      {
        tag: 'span.math-formula',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            latex: element.getAttribute('data-latex'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: 'math-formula',
    })];
  },

  addCommands() {
    return {
      insertMathLive: (latex?: string) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { latex: latex || '' },
        });
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathLiveComponent);
  },
});
