"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sigma } from "lucide-react";
import katex from "katex";

interface MathFormulaButtonProps {
  onInsert: (latex: string) => void;
  disabled?: boolean;
}

const quickInserts = [
  { label: "x²", latex: "x^{2}" },
  { label: "√x", latex: "\\sqrt{x}" },
  { label: "a/b", latex: "\\frac{a}{b}" },
  { label: "π", latex: "\\pi" },
  { label: "∑", latex: "\\sum" },
  { label: "±", latex: "\\pm" },
  { label: "≤", latex: "\\leq" },
  { label: "≥", latex: "\\geq" },
  { label: "∞", latex: "\\infty" },
  { label: "α", latex: "\\alpha" },
  { label: "β", latex: "\\beta" },
  { label: "θ", latex: "\\theta" },
];

export function MathFormulaButton({ onInsert, disabled }: MathFormulaButtonProps) {
  const [open, setOpen] = useState(false);
  const [latex, setLatex] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  const updatePreview = (value: string) => {
    setLatex(value);
    if (!value.trim()) {
      setPreview("");
      setError("");
      return;
    }

    try {
      const html = katex.renderToString(value, {
        throwOnError: true,
        displayMode: false,
      });
      setPreview(html);
      setError("");
    } catch (e: any) {
      setPreview("");
      setError(e.message || "Invalid LaTeX");
    }
  };

  const handleQuickInsert = (quickLatex: string) => {
    const newLatex = latex + quickLatex;
    updatePreview(newLatex);
  };

  const handleInsert = () => {
    if (!latex.trim() || error) return;
    onInsert(latex);
    setOpen(false);
    setLatex("");
    setPreview("");
    setError("");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        className="gap-1"
        onClick={() => setOpen(true)}
      >
        <Sigma className="h-4 w-4" />
        Insert Formula
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Insert Math Formula</DialogTitle>
          <DialogDescription>
            Type your formula or use quick insert buttons below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Insert Buttons */}
          <div>
            <Label className="text-sm mb-2 block">Quick Insert</Label>
            <div className="flex flex-wrap gap-2">
              {quickInserts.map((item) => (
                <Button
                  key={item.latex}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickInsert(item.latex)}
                  className="h-8"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Formula Input */}
          <div className="space-y-2">
            <Label htmlFor="latex-input">Your Formula</Label>
            <Input
              id="latex-input"
              value={latex}
              onChange={(e) => updatePreview(e.target.value)}
              placeholder="e.g., x^{2} + y^{2} = r^{2}"
              className="font-mono text-sm"
            />
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="min-h-[60px] p-4 border rounded-md bg-muted/30 flex items-center justify-center">
              {preview ? (
                <div
                  className="text-lg"
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {latex ? "Invalid formula" : "Preview will appear here"}
                </p>
              )}
            </div>
          </div>

          {/* Common Examples */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Common examples:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Fraction: <code>\frac{"{a}"}{"{b}"}</code></li>
              <li>Square root: <code>\sqrt{"{x}"}</code></li>
              <li>Power: <code>x^{"{2}"}</code></li>
              <li>Subscript: <code>a_{"{n}"}</code></li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleInsert}
              disabled={!latex.trim() || !!error}
            >
              Insert Formula
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
