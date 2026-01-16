"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// ============================================================================
// GLOBAL PADDLE TYPE DECLARATION
// ============================================================================

declare global {
    interface Window {
        Paddle?: any;
    }
}

// ============================================================================
// PADDLE CHECKOUT HANDLER COMPONENT
// ============================================================================

/**
 * Paddle Checkout Handler
 * 
 * This component handles Paddle checkout redirects and callbacks.
 * It detects the _ptxn (transaction) parameter and processes it.
 * 
 * Include this component in your layout to handle checkout returns.
 */
export function PaddleCheckoutHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const transactionId = searchParams.get('_ptxn');
        const checkoutStatus = searchParams.get('checkout');
        
        // Handle checkout cancellation
        if (checkoutStatus === 'cancelled') {
            toast.info('Checkout cancelled. No payment was made.');
            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('checkout');
            router.replace(url.pathname, { scroll: false });
            return;
        }

        // Handle transaction redirect
        if (!transactionId) {
            return;
        }

        console.log('🎯 Transaction parameter detected:', transactionId);

        // Determine Paddle environment
        const paddleEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production'
            ? 'buy'
            : 'sandbox-buy';

        // Build Paddle's hosted checkout URL
        const paddleCheckoutUrl = `https://${paddleEnvironment}.paddle.com/checkout?_ptxn=${transactionId}`;

        console.log('🚀 Redirecting to Paddle hosted checkout:', paddleCheckoutUrl);
        toast.info('Loading secure checkout...');

        // Redirect after brief delay to show toast
        setTimeout(() => {
            window.location.href = paddleCheckoutUrl;
        }, 500);

    }, [searchParams, router]);

    return null;
}

// ============================================================================
// PADDLE SCRIPT LOADER HOOK
// ============================================================================

/**
 * Hook to load Paddle.js script dynamically
 * Use this if you need Paddle.js overlay checkout (advanced)
 */
export function usePaddleScript() {
    useEffect(() => {
        const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
        const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox';

        if (!clientToken || window.Paddle) {
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
        script.async = true;

        script.onload = () => {
            if (window.Paddle) {
                try {
                    // Set environment first for sandbox
                    if (environment === 'sandbox') {
                        window.Paddle.Environment.set('sandbox');
                    }

                    window.Paddle.Initialize({
                        token: clientToken,
                    });

                    console.log(`✅ Paddle.js loaded (${environment})`);
                } catch (error) {
                    console.error('Failed to initialize Paddle.js:', error);
                }
            }
        };

        document.body.appendChild(script);
    }, []);
}

// ============================================================================
// UTILITY: Open Paddle Checkout Overlay
// ============================================================================

/**
 * Open Paddle checkout overlay for a transaction
 * Requires Paddle.js to be loaded first
 */
export function openPaddleCheckout(transactionId: string): boolean {
    if (!window.Paddle) {
        console.error('Paddle.js not loaded');
        return false;
    }

    try {
        window.Paddle.Checkout.open({
            transactionId,
        });
        return true;
    } catch (error) {
        console.error('Failed to open Paddle checkout:', error);
        return false;
    }
}
