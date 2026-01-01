"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyLinkButton({ examId, className }: { examId: string; className?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const origin = window.location.origin;
        const url = `${origin}/exam/${examId}`;

        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy} 
            className={cn(
                "transition-all relative overflow-hidden",
                copied && "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 dark:border-green-700",
                className
            )}
        >
            {copied ? (
                <>
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm font-medium">Copied!</span>
                </>
            ) : (
                <>
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Copy Link</span>
                    <ExternalLink className="h-3 w-3 ml-1 opacity-50 hidden sm:inline" />
                </>
            )}
        </Button>
    );
}
