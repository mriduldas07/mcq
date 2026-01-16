"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Paddle Checkout Handler
 * Detects _ptxn parameter and opens Paddle checkout overlay
 */
export function PaddleCheckoutHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const transactionId = searchParams.get('_ptxn');
        
        if (!transactionId) {
            return; // No transaction parameter, nothing to do
        }

        console.log('🎯 Transaction parameter detected:', transactionId);
        
        // Build Paddle's hosted checkout URL directly
        // This bypasses the need for client-side tokens and domain whitelisting
        const paddleEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production' 
            ? 'buy' 
            : 'sandbox-buy';
        
        // Paddle's hosted checkout URL format
        const paddleCheckoutUrl = `https://${paddleEnvironment}.paddle.com/checkout?_ptxn=${transactionId}`;
        
        console.log('🚀 Redirecting to Paddle hosted checkout:', paddleCheckoutUrl);
        toast.info('Loading secure checkout...');
        
        // Small delay to show the toast, then redirect
        setTimeout(() => {
            window.location.href = paddleCheckoutUrl;
        }, 800);

    }, [searchParams, router]);

    return null; // This component doesn't render anything
}

// Extend window type
declare global {
    interface Window {
        Paddle?: any;
    }
}
