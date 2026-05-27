"use client";

import { useEffect, useState } from "react";

interface FormattedDateProps {
    date: Date | string;
    className?: string;
}

export function FormattedDate({ date, className = "" }: FormattedDateProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Return a placeholder during SSR/hydration to avoid mismatches
        return <span className={className}>...</span>;
    }

    try {
        const d = new Date(date);
        return <span className={className}>{d.toLocaleString()}</span>;
    } catch (e) {
        return <span className={className}>{String(date)}</span>;
    }
}
