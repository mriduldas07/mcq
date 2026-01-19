"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { purchaseOneTimeExamAction, createProSubscriptionAction, cancelSubscriptionAction, pollBillingStatusAction } from "@/actions/payment";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Import SubscriptionStatusType with fallback for before migration
const SubscriptionStatusType = (() => {
    if (typeof window !== 'undefined') {
        // Client-side fallback
        return {
            NONE: "NONE",
            ACTIVE: "ACTIVE",
            CANCELED: "CANCELED",
            PAST_DUE: "PAST_DUE"
        };
    }
    // Server-side
    try {
        const client = require("@prisma/client");
        return client.SubscriptionStatusType || {
            NONE: "NONE",
            ACTIVE: "ACTIVE",
            CANCELED: "CANCELED",
            PAST_DUE: "PAST_DUE"
        };
    } catch (error) {
        return {
            NONE: "NONE",
            ACTIVE: "ACTIVE",
            CANCELED: "CANCELED",
            PAST_DUE: "PAST_DUE"
        };
    }
})();

// ============================================================================
// CONSTANTS
// ============================================================================

// Known subscription price IDs - maintain this list to match your Paddle products
const SUBSCRIPTION_PRICE_IDS = new Set([
    process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO_MONTHLY || '',
    process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO_YEARLY || '',
].filter(Boolean));

// ============================================================================
// TYPES
// ============================================================================

// Define subscription status type to match Prisma enum
type SubscriptionStatusTypeValue = 'NONE' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE';

interface BillingClientProps {
    isPro: boolean;
    freeExamsRemaining: number;
    oneTimeExamsRemaining: number;
    subscriptionStatus: SubscriptionStatusTypeValue;
    subscription?: {
        id: string;
        plan: string;
        status: string;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
    } | null;
    payments: Array<{
        id: string;
        type: string;
        status: string;
        amount: number;
        currency: string;
        createdAt: Date;
    }>;
}

type LoadingState = 'one-time' | 'MONTHLY' | 'YEARLY' | 'cancel' | null;

// ============================================================================
// PADDLE.JS INITIALIZATION
// ============================================================================

// Paddle types are declared globally in paddle-checkout-handler.tsx

/**
 * Poll for billing status updates after checkout
 * This is Vercel-friendly - doesn't rely on revalidatePath from webhooks
 * Polls the database directly until status changes or max attempts reached
 */
async function pollForBillingUpdate(
    expectedChange: 'subscription' | 'exam',
    initialIsPro: boolean,
    initialExamCredits: number,
    onSuccess: () => void,
    onTimeout: () => void,
    maxAttempts: number = 20,
    intervalMs: number = 1500,
    signal?: AbortSignal
): Promise<void> {
    let attempts = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Clear timeout and exit if aborted
    const cleanup = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };
    
    // Listen for abort signal
    if (signal) {
        signal.addEventListener('abort', cleanup);
    }
    
    const poll = async () => {
        // Check if aborted before polling
        if (signal?.aborted) {
            console.log('🛑 Polling aborted');
            cleanup();
            return;
        }
        
        attempts++;
        console.log(`🔄 Polling for billing update (attempt ${attempts}/${maxAttempts})...`);
        
        try {
            const result = await pollBillingStatusAction();
            
            // Check if aborted after async operation
            if (signal?.aborted) {
                console.log('🛑 Polling aborted');
                cleanup();
                return;
            }
            
            if (result.success && result.data) {
                const { isPro, oneTimeExamsRemaining } = result.data;
                
                // Check if the expected change happened
                if (expectedChange === 'subscription' && isPro && !initialIsPro) {
                    console.log('✅ Subscription activated detected!');
                    cleanup();
                    onSuccess();
                    return;
                }
                
                if (expectedChange === 'exam' && oneTimeExamsRemaining > initialExamCredits) {
                    console.log('✅ Exam credit added detected!');
                    cleanup();
                    onSuccess();
                    return;
                }
            }
            
            // Continue polling if max attempts not reached and not aborted
            if (attempts < maxAttempts && !signal?.aborted) {
                timeoutId = setTimeout(poll, intervalMs);
            } else if (attempts >= maxAttempts) {
                console.log('⏰ Polling timeout - redirecting anyway');
                cleanup();
                onTimeout();
            }
        } catch (error) {
            console.error('Polling error:', error);
            
            // Check if aborted after error
            if (signal?.aborted) {
                console.log('🛑 Polling aborted');
                cleanup();
                return;
            }
            
            if (attempts < maxAttempts && !signal?.aborted) {
                timeoutId = setTimeout(poll, intervalMs);
            } else if (attempts >= maxAttempts) {
                cleanup();
                onTimeout();
            }
        }
    };
    
    // Start polling after a short delay to give webhook time to process
    if (!signal?.aborted) {
        timeoutId = setTimeout(poll, 1000);
    }
}

function usePaddleJs(currentIsPro: boolean, currentExamCredits: number) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const router = useRouter();
    
    // Use refs to access current values in callback without stale closures
    const isProRef = useRef(currentIsPro);
    const examCreditsRef = useRef(currentExamCredits);
    
    useEffect(() => {
        isProRef.current = currentIsPro;
        examCreditsRef.current = currentExamCredits;
    }, [currentIsPro, currentExamCredits]);

    useEffect(() => {
        const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
        const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox';
        
        // Create AbortController for cleanup on unmount
        const abortController = new AbortController();

        if (!clientToken) {
            console.warn('Paddle client token not configured');
            return;
        }

        // Check if already loaded
        if (window.Paddle) {
            setIsLoaded(true);
            return;
        }

        // Load Paddle.js script
        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
        script.async = true;

        script.onload = () => {
            if (window.Paddle) {
                try {
                    window.Paddle.Initialize({
                        token: clientToken,
                        eventCallback: (event: any) => {
                            if (!event?.name) return;

                            console.log('🎾 Paddle event:', event.name);

                            switch (event.name) {
                                case 'checkout.completed':
                                    toast.success('Payment successful! Updating your account...');
                                    setIsPolling(true);
                                    
                                    // Determine what type of purchase was made using reliable detection
                                    const checkoutData = event.data;
                                    
                                    // Method 1: Check metadata (seller-controlled, most reliable)
                                    let isSubscription = checkoutData?.metadata?.is_subscription === 'true' || 
                                                        checkoutData?.metadata?.is_subscription === true;
                                    
                                    // Method 2: Check against known subscription price IDs
                                    if (isSubscription === undefined || isSubscription === null) {
                                        isSubscription = checkoutData?.items?.some((item: any) => {
                                            const priceId = item.price?.id;
                                            return priceId && SUBSCRIPTION_PRICE_IDS.has(priceId);
                                        }) ?? false;
                                    }
                                    
                                    // Method 3: Fallback to billing_cycle check (less reliable)
                                    if (!isSubscription && checkoutData?.items) {
                                        const hasBillingCycle = checkoutData.items.some((item: any) => 
                                            item.price?.billing_cycle?.interval || item.recurring?.billing_period
                                        );
                                        if (hasBillingCycle) {
                                            isSubscription = true;
                                            console.warn('⚠️ Subscription detected via billing_cycle fallback. Consider adding metadata or price ID mapping.');
                                        }
                                    }
                                    
                                    // Log detection failures for monitoring
                                    if (!isSubscription && !checkoutData?.items?.length) {
                                        console.error('❌ Unable to determine purchase type: no items in checkout data', {
                                            checkoutData,
                                            metadata: checkoutData?.metadata,
                                        });
                                    }
                                    
                                    // Default to false (one-time purchase) for unknown types
                                    const purchaseType = isSubscription ? 'subscription' : 'exam';
                                    console.log(`✅ Purchase type detected: ${purchaseType}`, { 
                                        metadata: checkoutData?.metadata,
                                        priceIds: checkoutData?.items?.map((i: any) => i.price?.id),
                                    });
                                    
                                    // Poll for the update (Vercel-friendly approach)
                                    pollForBillingUpdate(
                                        purchaseType,
                                        isProRef.current,
                                        examCreditsRef.current,
                                        () => {
                                            // Success - update detected
                                            setIsPolling(false);
                                            toast.success('Account updated successfully!');
                                            // Force a full page refresh to get fresh server data
                                            window.location.href = `/dashboard/billing?success=true&type=${purchaseType}`;
                                        },
                                        () => {
                                            // Timeout - redirect anyway (webhook might be slow)
                                            setIsPolling(false);
                                            toast.info('Payment received! Your account will update shortly.');
                                            window.location.href = `/dashboard/billing?success=true&type=${purchaseType}&pending=true`;
                                        },
                                        20, // max 20 attempts
                                        1500, // 1.5 seconds between attempts (total ~30 seconds)
                                        abortController.signal // Pass abort signal for cleanup
                                    );
                                    break;

                                case 'checkout.closed':
                                    console.log('Checkout closed by user');
                                    break;

                                case 'checkout.error':
                                    console.error('Checkout error:', event);
                                    const errorMsg = event.data?.error?.detail || 'Checkout failed';
                                    toast.error(errorMsg);
                                    break;

                                case 'checkout.loaded':
                                    console.log('Checkout loaded');
                                    break;
                            }
                        }
                    });

                    // Set environment
                    if (environment === 'sandbox') {
                        window.Paddle.Environment.set('sandbox');
                    }

                    setIsLoaded(true);
                    console.log(`✅ Paddle.js initialized (${environment})`);
                } catch (err: any) {
                    console.error('Failed to initialize Paddle:', err);
                    setError(err.message);
                }
            }
        };

        script.onerror = () => {
            setError('Failed to load payment system');
            console.error('Failed to load Paddle.js');
        };

        document.body.appendChild(script);

        return () => {
            // Abort any ongoing polling to prevent memory leaks
            abortController.abort();
        };
    }, [router]);

    return { isLoaded, error, isPolling };
}

// ============================================================================
// SUCCESS BANNER COMPONENT
// ============================================================================

function SuccessBanner({ type, plan }: { type: string; plan?: string }) {
    const getMessage = () => {
        if (type === 'subscription') {
            return `🎉 Welcome to Pro${plan ? ` (${plan})` : ''}! Your subscription is now active.`;
        }
        if (type === 'exam') {
            return '🎉 Exam credit purchased! You can now publish another exam.';
        }
        return '🎉 Payment successful!';
    };

    return (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
                <p className="font-medium text-green-800 dark:text-green-200">{getMessage()}</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                    Your account has been updated. Thank you for your purchase!
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// CANCEL BANNER COMPONENT
// ============================================================================

function CancelBanner() {
    return (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Payment cancelled</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    No worries! You can try again whenever you're ready.
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// POLLING/PENDING BANNER COMPONENT
// ============================================================================

function PollingBanner() {
    return (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 animate-spin" />
            <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">Processing your payment...</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                    Please wait while we update your account. This usually takes a few seconds.
                </p>
            </div>
        </div>
    );
}

function PendingBanner() {
    const router = useRouter();
    
    // Auto-refresh after 5 seconds to check if webhook has processed
    useEffect(() => {
        const timer = setTimeout(() => {
            router.refresh();
        }, 5000);
        return () => clearTimeout(timer);
    }, [router]);
    
    return (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 animate-spin" />
            <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">Payment received!</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                    Your account is being updated. This page will refresh automatically...
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BillingClient({
    isPro,
    freeExamsRemaining,
    oneTimeExamsRemaining,
    subscriptionStatus,
    subscription,
    payments
}: BillingClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [loadingState, setLoadingState] = useState<LoadingState>(null);
    const { isLoaded: paddleLoaded, error: paddleError, isPolling } = usePaddleJs(isPro, oneTimeExamsRemaining);

    // Check for success/cancel URL params
    const isSuccess = searchParams.get('success') === 'true';
    const isCancelled = searchParams.get('cancelled') === 'true';
    const isPending_url = searchParams.get('pending') === 'true';
    const purchaseType = searchParams.get('type');
    const planType = searchParams.get('plan');

    // FRONTEND GUARD: Check if user can subscribe
    // User should NOT be able to subscribe if they already have an active subscription
    // Check BOTH isPro and subscriptionStatus to handle all cases
    const hasActiveSubscription = 
        isPro || 
        subscriptionStatus === SubscriptionStatusType.ACTIVE ||
        (subscriptionStatus === SubscriptionStatusType.CANCELED && subscription && new Date() <= new Date(subscription.currentPeriodEnd));
    
    const canSubscribe = !hasActiveSubscription;
    
    // Grace period: User cancelled but still has access until period end
    // Check BOTH cancelAtPeriodEnd flag AND subscriptionStatus (webhooks may reset status)
    const isInGracePeriod = (
        (subscription?.cancelAtPeriodEnd === true) ||
        (subscriptionStatus === SubscriptionStatusType.CANCELED)
    ) && isPro && subscription && new Date() <= new Date(subscription.currentPeriodEnd);
    
    const isPastDue = subscriptionStatus === SubscriptionStatusType.PAST_DUE;
    
    // Determine current plan type for blocking duplicate purchases
    const hasMonthlyPlan = !!(subscription?.plan === 'MONTHLY' && hasActiveSubscription);
    const hasYearlyPlan = !!(subscription?.plan === 'YEARLY' && hasActiveSubscription);

    // Clear URL params after showing banner
    useEffect(() => {
        if (isSuccess || isCancelled) {
            const timer = setTimeout(() => {
                router.replace('/dashboard/billing', { scroll: false });
            }, 10000); // Clear after 10 seconds
            return () => clearTimeout(timer);
        }
    }, [isSuccess, isCancelled, router]);

    // Handle one-time exam purchase
    const handlePurchaseOneTime = useCallback(() => {
        setLoadingState('one-time');
        startTransition(async () => {
            try {
                const result = await purchaseOneTimeExamAction();

                if (result.error) {
                    toast.error(result.error);
                    setLoadingState(null);
                    return;
                }

                // Use Paddle.js overlay checkout with transaction ID
                if (result.transactionId && window.Paddle) {
                    toast.info('Opening secure checkout...');
                    window.Paddle.Checkout.open({
                        transactionId: result.transactionId,
                    });
                    setLoadingState(null);
                } else if (result.checkoutUrl) {
                    // Fallback to redirect if Paddle.js not loaded
                    toast.info('Redirecting to secure checkout...');
                    window.location.href = result.checkoutUrl;
                } else {
                    toast.error('Unable to create checkout');
                    setLoadingState(null);
                }
            } catch (error: any) {
                toast.error(error.message || 'Something went wrong');
                setLoadingState(null);
            }
        });
    }, []);

    // Handle Pro subscription upgrade
    // FRONTEND GUARD: Prevent subscription if user already has active subscription
    const handleUpgradePro = useCallback((plan: 'MONTHLY' | 'YEARLY') => {
        // Guard: Block if already has active subscription
        if (!canSubscribe) {
            toast.error('You already have an active Pro subscription. Please manage your existing subscription.');
            return;
        }

        setLoadingState(plan);
        startTransition(async () => {
            try {
                const result = await createProSubscriptionAction(plan);

                if (result.error) {
                    toast.error(result.error);
                    setLoadingState(null);
                    return;
                }

                // Use Paddle.js overlay checkout with transaction ID
                if (result.transactionId && window.Paddle) {
                    toast.info('Opening secure checkout...');
                    window.Paddle.Checkout.open({
                        transactionId: result.transactionId,
                    });
                    setLoadingState(null);
                } else if (result.checkoutUrl) {
                    // Fallback to redirect if Paddle.js not loaded
                    toast.info('Redirecting to secure checkout...');
                    window.location.href = result.checkoutUrl;
                } else {
                    toast.error('Unable to create checkout');
                    setLoadingState(null);
                }
            } catch (error: any) {
                toast.error(error.message || 'Something went wrong');
                setLoadingState(null);
            }
        });
    }, [canSubscribe]);

    // Handle subscription cancellation
    const handleCancelSubscription = useCallback(() => {
        if (!subscription?.id) return;

        if (!confirm('Are you sure you want to cancel your subscription? You will retain Pro access until the end of your billing period.')) {
            return;
        }

        setLoadingState('cancel');
        startTransition(async () => {
            try {
                const result = await cancelSubscriptionAction(subscription.id);

                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success(result.message || 'Subscription cancelled');
                    router.refresh();
                }
            } catch (error: any) {
                toast.error(error.message || 'Failed to cancel subscription');
            } finally {
                setLoadingState(null);
            }
        });
    }, [subscription?.id, router]);

    // Handle plan switching (Monthly <-> Yearly)
    const handleSwitchPlan = useCallback((targetPlan: 'MONTHLY' | 'YEARLY') => {
        const planName = targetPlan === 'MONTHLY' ? 'Monthly ($11.99/month)' : 'Yearly ($99/year)';
        
        toast.info(`Plan switching will be available soon. For now, please cancel your current subscription and resubscribe to the ${planName} plan.`);
        
        // TODO: Implement Paddle subscription update API
        // This should use subscription.updated webhook to change billing interval
        // without creating a new subscription
    }, []);

    // Format currency
    const formatAmount = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount / 100);
    };

    // Format date
    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            {/* Polling/Pending/Success/Cancel Banners */}
            {isPolling && <PollingBanner />}
            {isPending_url && !isPolling && <PendingBanner />}
            {isSuccess && !isPending_url && !isPolling && <SuccessBanner type={purchaseType || 'payment'} plan={planType || undefined} />}
            {isCancelled && <CancelBanner />}

            {/* Paddle Error Banner */}
            {paddleError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                    <p className="text-red-800 dark:text-red-200">
                        Payment system unavailable. Please refresh the page or try again later.
                    </p>
                </div>
            )}

            {/* Header */}
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
                <p className="text-muted-foreground">Simple, transparent pricing. No hidden fees.</p>
            </div>

            {/* Active Subscription Notice */}
            {isPro && subscription && (
                <div className="max-w-6xl mx-auto mb-6">
                    <Card className={`${
                        isPastDue 
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' 
                            : isInGracePeriod || subscription.cancelAtPeriodEnd
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
                                : 'border-primary bg-primary/5'
                    }`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                        isPastDue 
                                            ? 'bg-yellow-100 dark:bg-yellow-900' 
                                            : isInGracePeriod || subscription.cancelAtPeriodEnd
                                                ? 'bg-orange-100 dark:bg-orange-900'
                                                : 'bg-primary/10'
                                    }`}>
                                        {isPastDue ? (
                                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                                        ) : isInGracePeriod || subscription.cancelAtPeriodEnd ? (
                                            <AlertCircle className="h-5 w-5 text-orange-600" />
                                        ) : (
                                            <Sparkles className="h-5 w-5 text-primary" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold">
                                            Pro {subscription.plan === 'MONTHLY' ? 'Monthly' : subscription.plan === 'YEARLY' ? 'Yearly' : subscription.plan} Plan
                                            {(isInGracePeriod || subscription.cancelAtPeriodEnd) && <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full">Cancelling</span>}
                                            {isPastDue && <span className="ml-2 text-xs text-yellow-600">(Payment Issue)</span>}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {isPastDue 
                                                ? 'Payment failed. Please update your payment method.'
                                                : isInGracePeriod || subscription.cancelAtPeriodEnd 
                                                    ? `You have full Pro access until ${formatDate(subscription.currentPeriodEnd)}`
                                                    : `Renews on ${formatDate(subscription.currentPeriodEnd)}`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!subscription.cancelAtPeriodEnd && !isInGracePeriod && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelSubscription}
                                            disabled={loadingState === 'cancel'}
                                        >
                                            {loadingState === 'cancel' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Cancel Subscription
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Past Due Warning Banner */}
            {isPastDue && (
                <div className="max-w-6xl mx-auto mb-6">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">Payment Failed</p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                Your subscription payment failed. Please update your payment method to continue using Pro features.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Cards */}
            <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
                {/* FREE PLAN */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-2xl">Free</CardTitle>
                        <CardDescription>Perfect for trying out</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div>
                            <div className="text-4xl font-bold">$0</div>
                            <div className="text-sm text-muted-foreground">Forever</div>
                        </div>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>3 lifetime exams</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Basic exam features</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>20 question bank items</span>
                            </li>
                            <li className="flex items-start gap-2 text-muted-foreground">
                                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>No integrity tracking</span>
                            </li>
                            <li className="flex items-start gap-2 text-muted-foreground">
                                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>No anti-cheat</span>
                            </li>
                        </ul>
                        <div className="pt-4 border-t">
                            <div className="text-sm font-medium">Your Status:</div>
                            <div className="text-lg font-bold text-green-600">
                                {freeExamsRemaining}/3 exams remaining
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" disabled>
                            {isPro ? 'Included' : 'Current Plan'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* PRO PLAN */}
                <Card className="flex flex-col border-primary shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-linear-to-l from-primary to-primary/80 text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {isPro ? "Active" : "Most Popular"}
                    </div>
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            Pro
                            <Sparkles className="h-5 w-5 text-primary" />
                        </CardTitle>
                        <CardDescription>For serious educators</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <div>
                                <div className="text-4xl font-bold">$11.99</div>
                                <div className="text-sm text-muted-foreground">per month</div>
                            </div>
                            <div className="text-sm bg-muted p-2 rounded">
                                <strong>$99/year</strong>{" "}
                                <span className="text-xs text-muted-foreground">(Save $44.88)</span>
                            </div>
                        </div>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span><strong>Unlimited exams</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Full integrity tracking</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Anti-cheat features</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Unlimited question bank</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Advanced analytics</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Priority support</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                        {/* FRONTEND GUARD: Show appropriate button based on subscription status */}
                        {hasActiveSubscription && !isInGracePeriod ? (
                            // Active subscription - show which plan is active and allow switching
                            <>
                                <Button 
                                    className="w-full" 
                                    variant={hasMonthlyPlan ? "default" : "outline"}
                                    disabled={hasMonthlyPlan}
                                    onClick={() => !hasMonthlyPlan && handleSwitchPlan('MONTHLY')}
                                >
                                    {hasMonthlyPlan ? '✓ Current Plan - Monthly' : 'Monthly - $11.99/mo'}
                                </Button>
                                <Button 
                                    variant={hasYearlyPlan ? "default" : "outline"}
                                    className="w-full"
                                    disabled={hasYearlyPlan}
                                    onClick={() => !hasYearlyPlan && handleSwitchPlan('YEARLY')}
                                >
                                    {hasYearlyPlan ? '✓ Current Plan - Yearly' : 'Yearly - $99/yr (Save $44)'}
                                </Button>
                                <p className="text-xs text-muted-foreground text-center mt-2">
                                    {hasMonthlyPlan ? 'Upgrade to Yearly and save $44.88/year' : hasYearlyPlan ? 'You have the best value plan!' : ''}
                                </p>
                            </>
                        ) : isInGracePeriod ? (
                            // Cancelled but in grace period - show status and resubscribe option
                            <>
                                <div className="w-full p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg mb-2">
                                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                        ✓ Pro {subscription?.plan === 'MONTHLY' ? 'Monthly' : 'Yearly'} (Cancelling)
                                    </p>
                                    <p className="text-xs text-orange-600 dark:text-orange-400">
                                        You have full Pro access until {subscription ? formatDate(subscription.currentPeriodEnd) : 'the end of your billing period'}
                                    </p>
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={() => handleUpgradePro('MONTHLY')}
                                    disabled={isPending || !!loadingState}
                                >
                                    {loadingState === 'MONTHLY' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Resubscribe Monthly - $11.99
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleUpgradePro('YEARLY')}
                                    disabled={isPending || !!loadingState}
                                >
                                    {loadingState === 'YEARLY' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Resubscribe Yearly - $99
                                </Button>
                            </>
                        ) : (
                            // No active subscription - allow upgrade
                            <>
                                <Button
                                    className="w-full"
                                    onClick={() => handleUpgradePro('MONTHLY')}
                                    disabled={isPending || !!loadingState || !canSubscribe}
                                >
                                    {loadingState === 'MONTHLY' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Upgrade Monthly - $11.99
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleUpgradePro('YEARLY')}
                                    disabled={isPending || !!loadingState || !canSubscribe}
                                >
                                    {loadingState === 'YEARLY' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Upgrade Yearly - $99
                                </Button>
                            </>
                        )}
                    </CardFooter>
                </Card>

                {/* ONE-TIME PURCHASE */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-2xl">One-Time</CardTitle>
                        <CardDescription>Pay as you go</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div>
                            <div className="text-4xl font-bold">$1.99</div>
                            <div className="text-sm text-muted-foreground">per exam</div>
                        </div>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Purchase only when needed</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>All Pro features included</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Full integrity tracking</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Never expires</span>
                            </li>
                        </ul>
                        <div className="pt-4 border-t">
                            <div className="text-sm font-medium">Your Balance:</div>
                            <div className="text-lg font-bold text-blue-600">
                                {oneTimeExamsRemaining} exam{oneTimeExamsRemaining !== 1 ? 's' : ''} available
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={handlePurchaseOneTime}
                            disabled={isPending || !!loadingState}
                        >
                            {loadingState === 'one-time' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Buy 1 Exam - $1.99
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Transaction History */}
            <div className="mt-8 rounded-lg border p-4 bg-muted/50 max-w-6xl mx-auto">
                <h3 className="font-semibold mb-4">Transaction History</h3>
                {payments.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        No transactions yet. Your payment history will appear here.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="flex justify-between items-center bg-background p-3 rounded border"
                            >
                                <div>
                                    <div className="font-medium text-sm">
                                        {payment.type === 'ONE_TIME_EXAM' && '🎯 One-Time Exam'}
                                        {payment.type === 'SUBSCRIPTION' && '⭐ Pro Subscription'}
                                        {payment.type === 'CREDIT_PURCHASE' && '💳 Credit Purchase'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatDate(payment.createdAt)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${
                                            payment.status === 'COMPLETED'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                : payment.status === 'PENDING'
                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                        }`}
                                    >
                                        {payment.status}
                                    </span>
                                    <span className="font-bold text-sm">
                                        {formatAmount(payment.amount, payment.currency)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Help Text */}
            <div className="max-w-6xl mx-auto mt-6 text-center text-sm text-muted-foreground">
                <p>
                    Payments are processed securely by{" "}
                    <a
                        href="https://paddle.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground"
                    >
                        Paddle
                    </a>
                    . Need help?{" "}
                    <a href="mailto:support@example.com" className="underline hover:text-foreground">
                        Contact support
                    </a>
                </p>
            </div>
        </div>
    );
}
