"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyLinkButton({ examId }: { examId: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        // Determine the base URL. In dev it's localhost:3000. 
        // In production we should use the env var or window.location.origin
        const origin = window.location.origin;
        const url = `${origin}/exam/${examId}`;

        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button variant="outline" size="sm" onClick={handleCopy} className={cn("transition-all", copied && "border-green-500 text-green-600")}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy Link"}
        </Button>
    );
}
