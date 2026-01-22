declare module 'mathlive' {
  export interface MathfieldElement extends HTMLElement {
    getValue(format?: string): string;
    setValue(value: string): void;
    setOptions(options: MathfieldOptions): void;
    focus(): void;
    blur(): void;
    executeCommand(command: string): void;
  }

  export interface MathfieldOptions {
    virtualKeyboardMode?: 'off' | 'onfocus' | 'manual';
    smartMode?: boolean;
    smartFence?: boolean;
    smartSuperscript?: boolean;
    removeExtraneousParentheses?: boolean;
    mathModeSpace?: string;
    inlineShortcuts?: Record<string, string>;
    inlineShortcutTimeout?: number;
    customVirtualKeyboardLayers?: Record<string, VirtualKeyboardLayer>;
    virtualKeyboards?: string;
  }

  export interface VirtualKeyboardLayer {
    styles?: string;
    rows: VirtualKeyboardRow[];
  }

  export type VirtualKeyboardRow = VirtualKeyboardKey[];

  export interface VirtualKeyboardKey {
    latex?: string;
    label?: string;
    tooltip?: string;
    class?: string;
    insert?: string;
    command?: string;
  }

}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        ref?: React.Ref<any>;
        class?: string;
        style?: React.CSSProperties;
      };
    }
  }
}
