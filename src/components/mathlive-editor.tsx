/// <reference path="../types/mathlive.d.ts" />
"use client";

import { useEffect, useRef, useState } from "react";
import { MathfieldElement } from "mathlive";
import { Button } from "./ui/button";
import { Check, X } from "lucide-react";

// Import MathLive styles
import "mathlive/fonts.css";
import "mathlive/static.css";

interface MathLiveEditorProps {
  initialValue?: string;
  onInsert: (latex: string) => void;
  onCancel: () => void;
  inline?: boolean;
}

export function MathLiveEditor({
  initialValue = "",
  onInsert,
  onCancel,
  inline = true,
}: MathLiveEditorProps) {
  const mathfieldRef = useRef<HTMLElement>(null);
  const [isReady, setIsReady] = useState(false);
  const onInsertRef = useRef(onInsert);
  
  // Keep onInsert ref up to date
  useEffect(() => {
    onInsertRef.current = onInsert;
  }, [onInsert]);

  useEffect(() => {
    // Dynamically import MathLive web component
    import("mathlive")
      .then(() => {
        setIsReady(true);
      })
      .catch((error) => {
        console.error('Failed to load MathLive:', error);
        setIsReady(false);
      });
  }, []);

  useEffect(() => {
    if (!isReady || !mathfieldRef.current) return;

    const mathfield = mathfieldRef.current as any;
    let isMounted = true;

    // Configure MathLive for predictable typing
    mathfield.setOptions({
      virtualKeyboardMode: "onfocus",
      smartMode: false, // Disable smart mode for predictable behavior
      smartFence: false, // Disable auto-matching brackets
      smartSuperscript: false, // Disable automatic superscript
      removeExtraneousParentheses: false,
      mathModeSpace: "\\,",
      inlineShortcuts: {
        // Only enable essential shortcuts that require Tab to complete
        // This prevents accidental transformations while typing
      },
      inlineShortcutTimeout: 3000, // 3 second timeout before shortcuts activate
      // Custom virtual keyboard layout
      customVirtualKeyboardLayers: {
        "word-style": {
          styles: "",
          rows: [
            [
              { latex: "x^{2}", label: "x²", tooltip: "Superscript" },
              { latex: "x^{#?}", label: "xⁿ", tooltip: "Power" },
              { latex: "\\sqrt{#?}", label: "√", tooltip: "Square root" },
              { latex: "\\frac{#?}{#?}", label: "a/b", tooltip: "Fraction" },
              { latex: "x_{#?}", label: "xₙ", tooltip: "Subscript" },
              { latex: "|#?|", label: "|x|", tooltip: "Absolute value" },
              { latex: "\\pm", label: "±" },
            ],
            [
              { latex: "\\pi", label: "π" },
              { latex: "\\theta", label: "θ" },
              { latex: "\\alpha", label: "α" },
              { latex: "\\beta", label: "β" },
              { latex: "\\gamma", label: "γ" },
              { latex: "\\lambda", label: "λ" },
              { latex: "\\mu", label: "μ" },
            ],
            [
              { latex: "\\leq", label: "≤" },
              { latex: "\\geq", label: "≥" },
              { latex: "\\neq", label: "≠" },
              { latex: "\\approx", label: "≈" },
              { latex: "<", label: "<" },
              { latex: ">", label: ">" },
              { latex: "=", label: "=" },
            ],
            [
              { latex: "\\sum", label: "∑", tooltip: "Sum" },
              { latex: "\\int", label: "∫", tooltip: "Integral" },
              { latex: "\\lim_{#?\\to#?}", label: "lim", tooltip: "Limit" },
              { latex: "\\infty", label: "∞" },
              { latex: "^\\circ", label: "°" },
              { latex: "\\times", label: "×" },
              { latex: "\\div", label: "÷" },
            ],
          ],
        },
      },
      virtualKeyboards: "word-style numeric symbols",
    });

    // Set initial value
    if (initialValue) {
      mathfield.setValue(initialValue);
    }

    // Auto-focus
    setTimeout(() => {
      if (isMounted && mathfield) {
        mathfield.focus();
      }
    }, 100);

    // Handle Enter key to insert
    const handleKeydown = (evt: KeyboardEvent) => {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault();
        handleInsert();
      } else if (evt.key === "Escape") {
        evt.preventDefault();
        onCancel();
      }
    };

    mathfield.addEventListener("keydown", handleKeydown);

    return () => {
      isMounted = false;
      mathfield.removeEventListener("keydown", handleKeydown);
    };
  }, [isReady, initialValue, onCancel]);

  const handleInsert = () => {
    if (!mathfieldRef.current) return;
    const latex = (mathfieldRef.current as any).getValue();
    if (latex && latex.trim()) {
      onInsert(latex);
    }
  };

  if (!isReady) {
    return (
      <div className="inline-flex items-center justify-center p-2 bg-muted rounded animate-pulse">
        <span className="text-xs text-muted-foreground">Loading math editor...</span>
      </div>
    );
  }

  return (
    <div className={inline ? "inline-flex items-center gap-2" : "flex flex-col gap-2"}>
      <div className="relative inline-block">
        {/* @ts-expect-error - MathLive custom element not in JSX types */}
        <math-field
          ref={mathfieldRef}
          class="mathlive-field"
          style={{
            display: "inline-block",
            minWidth: "200px",
            padding: "6px 12px",
            fontSize: "16px",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            outline: "2px solid hsl(var(--ring))",
            outlineOffset: "2px",
          }}
        >
          {initialValue}
        {/* @ts-expect-error - MathLive custom element */}
        </math-field>
      </div>
      <div className="inline-flex gap-1">
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={handleInsert}
          className="h-7 px-2"
          aria-label="Confirm and insert formula"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-7 px-2"
          aria-label="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
