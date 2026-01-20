import { Mark, mergeAttributes } from '@tiptap/core';

export interface MathOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    math: {
      setMath: (latex: string) => ReturnType;
    };
  }
}

export const Math = Mark.create<MathOptions>({
  name: 'math',

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
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: 'math-formula',
    }), 0];
  },

  addCommands() {
    return {
      setMath: (latex: string) => ({ commands }) => {
        return commands.setMark(this.name, { latex });
      },
    };
  },
});
