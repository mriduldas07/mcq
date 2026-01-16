"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { purchaseOneTimeExamAction, createProSubscriptionAction } from "@/actions/payment";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Paddle.js types
declare global {
    interface Window {
        Paddle?: any;
    }
}

interface BillingClientProps {
    isPro: boolean;
    freeExamsRemaining: number;
    oneTimeExamsRemaining: number;
    payments: Array<{
        id: string;
        type: string;
        status: string;
        amount: number;
        createdAt: Date;
    }>;
}

export function BillingClient({
    isPro,
    freeExamsRemaining,
    oneTimeExamsRemaining,
    payments
}: BillingClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [paddleLoaded, setPaddleLoaded] = useState(false);

    useEffect(() => {
        // Load Paddle.js script
        const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;
        const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

        // Check if Paddle is configured
        if (!environment || !clientToken) {
            console.error('Paddle configuration missing. Please set NEXT_PUBLIC_PADDLE_ENVIRONMENT and NEXT_PUBLIC_PADDLE_CLIENT_TOKEN');
            toast.error('Payment system not configured. Please contact support.');
            return;
        }

        if (!window.Paddle) {
            const script = document.createElement('script');
            script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
            script.async = true;
            script.onload = () => {
                if (window.Paddle) {
                    try {
                        window.Paddle.Initialize({
                            token: clientToken,
                            eventCallback: (event: any) => {
                                // Guard against undefined events
                                if (!event || !event.name) {
                                    console.warn('Received undefined or invalid Paddle event:', event);
                                    return;
                                }
                                
                                console.log('Paddle event:', event.name, event);
                                
                                if (event.name === 'checkout.completed') {
                                    toast.success('Payment successful! Refreshing...');
                                    setTimeout(() => router.refresh(), 2000);
                                } else if (event.name === 'checkout.error') {
                                    console.error('=== PADDLE CHECKOUT ERROR ===');
                                    console.error('Event object:', event);
                                    console.error('Event.name:', event.name);
                                    console.error('Event.data:', event.data);
                                    console.error('Event.error:', event.error);
                                    
                                    // Try to serialize the full event
                                    try {
                                        console.error('Full event JSON:', JSON.stringify(event, null, 2));
                                    } catch (e) {
                                        console.error('Cannot serialize event:', e);
                                        // Try to log all properties
                                        console.error('Event keys:', Object.keys(event));
                                        for (const key in event) {
                                            console.error(`  ${key}:`, event[key]);
                                        }
                                    }
                                    
                                    const errorMessage = event.data?.error?.detail 
                                        || event.data?.error?.message 
                                        || event.data?.error
                                        || event.error?.detail 
                                        || event.error?.message
                                        || event.error
                                        || event.detail
                                        || event.message
                                        || 'Unknown checkout error - check console for details';
                                    
                                    toast.error(`Checkout failed: ${errorMessage}`);
                                } else if (event.name === 'checkout.closed') {
                                    console.log('Checkout closed by user');
                                } else if (event.name === 'checkout.loaded') {
                                    console.log('Checkout loaded successfully');
                                }
                            }
                        });
                        setPaddleLoaded(true);
                        console.log(`Paddle initialized successfully in ${environment} mode`);
                        console.log('Paddle client token:', clientToken.substring(0, 10) + '...');
                        // Check for transaction parameter in URL and open checkout
                        const urlParams = new URLSearchParams(window.location.search);
                        const transactionId = urlParams.get('_ptxn');
                        if (transactionId) {
                            console.log('🎯 Transaction parameter detected:', transactionId);
                            console.log('Opening Paddle checkout automatically...');
                            
                            // Small delay to ensure Paddle is fully initialized
                            setTimeout(() => {
                                try {
                                    window.Paddle.Checkout.open({
                                        transactionId: transactionId
                                    });
                                    console.log('✅ Paddle checkout opened with transaction:', transactionId);
                                } catch (error) {
                                    console.error('❌ Failed to open Paddle checkout:', error);
                                    toast.error('Failed to open checkout. Please try again.');
                                }
                            }, 500);
                        }                    } catch (error: any) {
                        console.error('Failed to initialize Paddle:', error);
                        console.error('Error message:', error.message);
                        console.error('Error stack:', error.stack);
                        toast.error('Failed to initialize payment system');
                    }
                }
            };
            script.onerror = () => {
                console.error('Failed to load Paddle.js script');
                toast.error('Failed to load payment system');
            };
            document.body.appendChild(script);
        } else if (window.Paddle) {
            setPaddleLoaded(true);
        }
    }, [router]);

    const handlePurchaseOneTime = () => {
        setLoadingAction('one-time');
        startTransition(async () => {
            try {
                const result = await purchaseOneTimeExamAction();
                console.log('Purchase one-time result:', result);
                
                if (result.error) {
                    console.error('Server error:', result.error);
                    toast.error(result.error);
                    setLoadingAction(null);
                } else if (result.checkoutUrl) {
                    // Redirect to Paddle checkout page
                    toast.info('Redirecting to checkout...');
                    window.location.href = result.checkoutUrl;
                } else {
                    console.error('Unexpected result structure:', result);
                    toast.error('Invalid checkout response');
                    setLoadingAction(null);
                }
            } catch (error: any) {
                console.error('Action error:', error);
                toast.error(`Error: ${error.message || 'Something went wrong'}`);
                setLoadingAction(null);
            }
        });
    };

    const handleUpgradePro = (plan: 'MONTHLY' | 'YEARLY') => {
        setLoadingAction(plan);
        startTransition(async () => {
            try {
                const result = await createProSubscriptionAction(plan);
                console.log('Create Pro subscription result:', result);
                
                if (result.error) {
                    console.error('Server error:', result.error);
                    toast.error(result.error);
                    setLoadingAction(null);
                } else if (result.checkoutUrl) {
                    // Redirect to Paddle checkout page
                    toast.info('Redirecting to checkout...');
                    window.location.href = result.checkoutUrl;
                } else {
                    console.error('Unexpected result structure:', result);
                    toast.error('Invalid checkout response');
                    setLoadingAction(null);
                }
            } catch (error: any) {
                console.error('Action error:', error);
                toast.error(`Error: ${error.message || 'Something went wrong'}`);
                setLoadingAction(null);
            }
        });
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
                <p className="text-muted-foreground">Simple, transparent pricing. No hidden fees.</p>
            </div>

            {/* Three-Tier Pricing Cards */}
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
                            <li className="flex items-start gap-2 opacity-50">
                                <span className="text-xs">❌ No integrity tracking</span>
                            </li>
                            <li className="flex items-start gap-2 opacity-50">
                                <span className="text-xs">❌ No anti-cheat</span>
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
                        <Button variant="outline" className="w-full" disabled>Current Plan</Button>
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
                                <strong>$99/year</strong> <span className="text-xs text-muted-foreground">(Save $44.88)</span>
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
                        {isPro ? (
                            <>
                                <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                                <p className="text-xs text-muted-foreground text-center">
                                    Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                </p>
                            </>
                        ) : (
                            <>
                                <Button 
                                    className="w-full" 
                                    onClick={() => handleUpgradePro('MONTHLY')}
                                    disabled={isPending}
                                >
                                    {loadingAction === 'MONTHLY' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Upgrade to Pro Monthly
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full" 
                                    onClick={() => handleUpgradePro('YEARLY')}
                                    disabled={isPending}
                                >
                                    {loadingAction === 'YEARLY' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Upgrade to Pro Yearly
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
                            disabled={isPending}
                        >
                            {loadingAction === 'one-time' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Buy 1 Exam ($1.99)
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Transaction History */}
            <div className="mt-8 rounded-lg border p-4 bg-muted/50 max-w-6xl mx-auto">
                <h3 className="font-semibold mb-4">Transaction History</h3>
                {payments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No transactions found.</div>
                ) : (
                    <div className="space-y-2">
                        {payments.map((payment) => (
                            <div key={payment.id} className="flex justify-between items-center bg-background p-3 rounded border">
                                <div>
                                    <div className="font-medium text-sm">{payment.type.replace('_', ' ')}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full ${payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {payment.status}
                                    </span>
                                    <span className="font-bold text-sm">${(payment.amount / 100).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
