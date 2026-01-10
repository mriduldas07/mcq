"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  description: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (stepIndex: number) => void;
}

export function ProgressIndicator({ 
  steps, 
  currentStep, 
  completedSteps = [],
  onStepClick 
}: ProgressIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => {
          const isCompleted = completedSteps.includes(stepIdx);
          const isCurrent = stepIdx === currentStep;
          const isClickable = onStepClick && (isCompleted || stepIdx < currentStep);

          return (
            <li
              key={step.id}
              className={cn(
                "relative flex-1",
                stepIdx !== steps.length - 1 && "pr-8 sm:pr-20"
              )}
            >
              {/* Connector Line */}
              {stepIdx !== steps.length - 1 && (
                <div
                  className="absolute top-4 left-0 -ml-px mt-0.5 h-0.5 w-full"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      isCompleted
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(stepIdx)}
                disabled={!isClickable}
                className={cn(
                  "group relative flex items-start",
                  isClickable && "cursor-pointer hover:opacity-80"
                )}
              >
                <span className="flex h-9 items-center" aria-hidden="true">
                  <span
                    className={cn(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-muted bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{stepIdx + 1}</span>
                    )}
                  </span>
                </span>
                <span className="ml-4 mt-0.5 flex min-w-0 flex-col">
                  <span
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
