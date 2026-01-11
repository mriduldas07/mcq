"use client";

import { Check, Sparkles } from "lucide-react";
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
    <nav aria-label="Progress" className="py-3 sm:py-4 md:py-6">
      <div className="relative">
        <ol className="relative flex items-center justify-between">
          {steps.map((step, stepIdx) => {
            const isCompleted = completedSteps.includes(stepIdx);
            const isCurrent = stepIdx === currentStep;
            const isClickable = onStepClick && (isCompleted || stepIdx < currentStep);

            return (
              <li
                key={step.id}
                className={cn(
                  "relative flex-1 flex flex-col items-center",
                  stepIdx !== steps.length - 1 && "pr-2 sm:pr-3 md:pr-4"
                )}
              >
                {/* Connector Line */}
                {stepIdx !== steps.length - 1 && (
                  <div
                    className="absolute top-4 sm:top-5 left-1/2 w-full h-0.5 z-0"
                    aria-hidden="true"
                  >
                    <div
                      className={cn(
                        "h-full w-full transition-all duration-500 ease-out",
                        isCompleted
                          ? "bg-primary"
                          : "bg-border"
                      )}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => isClickable && onStepClick?.(stepIdx)}
                  disabled={!isClickable}
                  className={cn(
                    "group relative flex flex-col items-center z-10 transition-all duration-200",
                    isClickable && "cursor-pointer hover:-translate-y-0.5"
                  )}
                >
                  <div className="relative mb-2 sm:mb-2.5 md:mb-3">
                    <span
                      className={cn(
                        "relative z-10 flex items-center justify-center rounded-full border-2 transition-all duration-300",
                        "h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10",
                        isCompleted
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : isCurrent
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      ) : (
                        <span className="text-xs sm:text-sm font-medium">{stepIdx + 1}</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center text-center max-w-20 sm:max-w-25 md:max-w-35">
                    <span
                      className={cn(
                        "transition-all duration-300 mb-0.5 font-medium",
                        "text-[10px] sm:text-xs md:text-sm",
                        isCurrent || isCompleted
                          ? "text-foreground" 
                          : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                    <span className={cn(
                      "text-[9px] sm:text-[10px] md:text-xs transition-colors duration-300 hidden sm:block",
                      isCurrent ? "text-muted-foreground" : "text-muted-foreground/60"
                    )}>
                      {step.description}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
