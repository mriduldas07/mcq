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
import { Sigma, X } from "lucide-react";
import katex from "katex";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MathFormulaButtonProps {
  onInsert: (latex: string) => void;
  disabled?: boolean;
}

// Word-style structure templates
const structures = [
  {
    name: "Fraction",
    icon: "a/b",
    template: "\\frac{numerator}{denominator}",
    preview: "\\frac{a}{b}",
    inputs: ["numerator", "denominator"],
  },
  {
    name: "Superscript",
    icon: "x²",
    template: "base^{exponent}",
    preview: "x^{2}",
    inputs: ["base", "exponent"],
  },
  {
    name: "Subscript",
    icon: "xₙ",
    template: "base_{subscript}",
    preview: "x_{n}",
    inputs: ["base", "subscript"],
  },
  {
    name: "Square Root",
    icon: "√",
    template: "\\sqrt{value}",
    preview: "\\sqrt{x}",
    inputs: ["value"],
  },
  {
    name: "Nth Root",
    icon: "ⁿ√",
    template: "\\sqrt[n]{value}",
    preview: "\\sqrt[3]{x}",
    inputs: ["n", "value"],
  },
  {
    name: "Power & Subscript",
    icon: "xₙᵐ",
    template: "base_{subscript}^{superscript}",
    preview: "x_{n}^{m}",
    inputs: ["base", "subscript", "superscript"],
  },
];

// Quick symbols like Word
const symbols = [
  { label: "π", latex: "\\pi" },
  { label: "∞", latex: "\\infty" },
  { label: "°", latex: "^\\circ" },
  { label: "±", latex: "\\pm" },
  { label: "÷", latex: "\\div" },
  { label: "×", latex: "\\times" },
  { label: "≤", latex: "\\leq" },
  { label: "≥", latex: "\\geq" },
  { label: "≠", latex: "\\neq" },
  { label: "≈", latex: "\\approx" },
  { label: "∑", latex: "\\sum" },
  { label: "∫", latex: "\\int" },
  { label: "α", latex: "\\alpha" },
  { label: "β", latex: "\\beta" },
  { label: "θ", latex: "\\theta" },
  { label: "Δ", latex: "\\Delta" },
];

export function MathFormulaButton({ onInsert, disabled }: MathFormulaButtonProps) {
  const [open, setOpen] = useState(false);
  const [formula, setFormula] = useState("");
  const [preview, setPreview] = useState("");
  const [selectedStructure, setSelectedStructure] = useState<typeof structures[0] | null>(null);
  const [structureInputs, setStructureInputs] = useState<Record<string, string>>({});

  const updatePreview = (value: string) => {
    if (!value.trim()) {
      setPreview("");
      return;
    }

    try {
      const html = katex.renderToString(value, {
        throwOnError: false,
        displayMode: false,
      });
      setPreview(html);
    } catch (e) {
      setPreview("");
    }
  };

  const handleStructureSelect = (structure: typeof structures[0]) => {
    setSelectedStructure(structure);
    const inputs: Record<string, string> = {};
    structure.inputs.forEach(input => {
      inputs[input] = "";
    });
    setStructureInputs(inputs);
  };

  const handleStructureInputChange = (key: string, value: string) => {
    setStructureInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleStructureInsert = () => {
    if (!selectedStructure) return;
    
    let result = selectedStructure.template;
    Object.entries(structureInputs).forEach(([key, value]) => {
      result = result.replace(key, value || " ");
    });
    
    setFormula(result);
    updatePreview(result);
    setSelectedStructure(null);
    setStructureInputs({});
  };

  const handleSymbolClick = (symbolLatex: string) => {
    const newFormula = formula + symbolLatex;
    setFormula(newFormula);
    updatePreview(newFormula);
  };

  const handleTextInput = (value: string) => {
    setFormula(value);
    updatePreview(value);
  };

  const handleInsert = () => {
    if (!formula.trim()) return;
    onInsert(formula);
    setOpen(false);
    setFormula("");
    setPreview("");
    setSelectedStructure(null);
    setStructureInputs({});
  };

  const handleClear = () => {
    setFormula("");
    setPreview("");
    setSelectedStructure(null);
    setStructureInputs({});
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
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Insert Equation</DialogTitle>
            <DialogDescription>
              Build your equation using structures and symbols, just like Microsoft Word
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="structures" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="structures">Structures</TabsTrigger>
              <TabsTrigger value="symbols">Symbols</TabsTrigger>
              <TabsTrigger value="text">Text Input</TabsTrigger>
            </TabsList>

            {/* Structures Tab - Like Word's Equation Designer */}
            <TabsContent value="structures" className="space-y-4">
              <div>
                <Label className="text-sm mb-3 block">Select Structure</Label>
                <div className="grid grid-cols-3 gap-2">
                  {structures.map((structure) => (
                    <Button
                      key={structure.name}
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => handleStructureSelect(structure)}
                      className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400"
                    >
                      <span className="text-3xl font-serif">{structure.icon}</span>
                      <span className="text-xs text-muted-foreground">{structure.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Structure Input Dialog */}
              {selectedStructure && (
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      {selectedStructure.name}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStructure(null);
                        setStructureInputs({});
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedStructure.inputs.map((input) => (
                      <div key={input}>
                        <Label className="text-xs capitalize mb-1 block">{input}</Label>
                        <Input
                          value={structureInputs[input] || ""}
                          onChange={(e) => handleStructureInputChange(input, e.target.value)}
                          placeholder={`Enter ${input}`}
                          className="text-sm"
                          autoFocus={input === selectedStructure.inputs[0]}
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={handleStructureInsert}
                    className="w-full"
                    size="sm"
                  >
                    Add to Equation
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Symbols Tab */}
            <TabsContent value="symbols" className="space-y-4">
              <div>
                <Label className="text-sm mb-3 block">Click Symbol to Add</Label>
                <div className="grid grid-cols-8 gap-2">
                  {symbols.map((symbol) => (
                    <Button
                      key={symbol.latex}
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => handleSymbolClick(symbol.latex)}
                      className="h-14 text-2xl hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400"
                      title={symbol.label}
                    >
                      {symbol.label}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Text Input Tab */}
            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-input">Type your equation</Label>
                <Input
                  id="text-input"
                  value={formula}
                  onChange={(e) => handleTextInput(e.target.value)}
                  placeholder="e.g., x^2 + 2x + 1"
                  className="text-lg font-serif"
                />
                <p className="text-xs text-muted-foreground">
                  Tips: Use ^ for superscript (x^2), _ for subscript (x_n), / will be converted to fraction
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Preview - Always visible */}
          <div className="space-y-2 mt-4 pt-4 border-t">
            <Label>Preview</Label>
            <div className="min-h-[80px] p-4 border-2 rounded-md bg-white dark:bg-gray-900 flex items-center justify-center">
              {preview ? (
                <div
                  className="text-3xl"
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Your equation will appear here
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!formula}
            >
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  handleClear();
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleInsert}
                disabled={!formula.trim()}
              >
                Insert Equation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
