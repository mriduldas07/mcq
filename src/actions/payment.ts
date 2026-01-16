"use server";

import { verifySession } from "@/lib/session";
import { PaymentService } from "@/lib/payment-service";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { paddle, PADDLE_PRICE_IDS } from "@/lib/paddle";

/**
 * Initialize Paddle checkout for one-time exam purchase ($1.99)
 * Uses server-side API to create checkout session (no domain restrictions)
 */
export async function purchaseOneTimeExamAction() {
    const session = await verifySession();
    if (!session) return { error: "Unauthorized" };

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { email: true, name: true }
        });

        if (!user || !user.email) return { error: "User not found or email missing" };

        if (!paddle) {
            return { error: "Payment system not configured" };
        }

        // Step 1: Create or get customer in Paddle
        let paddleCustomerId: string;
        
        try {
            // Try to create new customer
            const newCustomer = await paddle.customers.create({
                email: user.email,
                name: user.name || undefined
            });
            paddleCustomerId = newCustomer.id;
            console.log('Created new Paddle customer:', paddleCustomerId);
        } catch (customerError: any) {
            // If customer already exists, extract ID from error message
            if (customerError.code === 'customer_already_exists' && customerError.detail) {
                const match = customerError.detail.match(/ctm_[a-z0-9]+/);
                if (match) {
                    paddleCustomerId = match[0];
                    console.log('Using existing Paddle customer:', paddleCustomerId);
                } else {
                    console.error('Could not extract customer ID from error:', customerError);
                    return { error: "Failed to setup customer account" };
                }
            } else {
                console.error('Customer creation failed:', customerError);
                return { error: "Failed to setup customer account" };
            }
        }

        // Step 2: Create Paddle checkout directly using API
        const paddleApiUrl = process.env.PADDLE_ENVIRONMENT === 'production' 
            ? 'https://api.paddle.com' 
            : 'https://sandbox-api.paddle.com';

        const checkoutResponse = await fetch(`${paddleApiUrl}/checkouts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [{ price_id: PADDLE_PRICE_IDS.ONE_TIME_EXAM, quantity: 1 }],
                customer_id: paddleCustomerId,
                custom_data: {
                    userId: session.userId,
                    email: user.email
                }
            })
        });

        if (!checkoutResponse.ok) {
            const errorData = await checkoutResponse.text();
            console.error('Paddle checkout creation failed:', errorData);
            return { error: "Failed to create checkout session" };
        }

        const checkoutData = await checkoutResponse.json();
        console.log('Paddle checkout created:', JSON.stringify(checkoutData, null, 2));

        // Paddle returns checkout URL in data.url
        const checkoutUrl = checkoutData.data?.url;
        
        if (!checkoutUrl) {
            console.error('No checkout URL in response:', checkoutData);
            return { error: "Failed to get checkout URL" };
        }

        console.log('Paddle checkout URL:', checkoutUrl);
        
        // Return the checkout URL from Paddle
        return { 
            success: true, 
            checkoutUrl,
            useServerCheckout: true
        };
    } catch (e: any) {
        console.error("Purchase one-time exam failed", e);
        return { error: e.message || "Failed to create checkout" };
    }
}

/**
 * Initialize Paddle checkout for Pro subscription (Monthly or Yearly)
 * Uses server-side API to create checkout session (no domain restrictions)
 */
export async function createProSubscriptionAction(
    plan: 'MONTHLY' | 'YEARLY'
) {
    const session = await verifySession();
    if (!session) return { error: "Unauthorized" };

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { email: true, name: true }
        });

        if (!user || !user.email) return { error: "User not found or email missing" };

        // Check if user already has an active subscription
        const hasActiveSub = await PaymentService.hasActiveProSubscription(session.userId);
        if (hasActiveSub) {
            return { error: "You already have an active Pro subscription" };
        }

        const priceId = plan === 'MONTHLY' 
            ? PADDLE_PRICE_IDS.PRO_MONTHLY 
            : PADDLE_PRICE_IDS.PRO_YEARLY;

        if (!paddle) {
            return { error: "Payment system not configured" };
        }

        // Step 1: Create or get customer in Paddle
        let paddleCustomerId: string;
        
        try {
            // Try to create new customer
            const newCustomer = await paddle.customers.create({
                email: user.email,
                name: user.name || undefined
            });
            paddleCustomerId = newCustomer.id;
            console.log('Created new Paddle customer:', paddleCustomerId);
        } catch (customerError: any) {
            // If customer already exists, extract ID from error message
            if (customerError.code === 'customer_already_exists' && customerError.detail) {
                const match = customerError.detail.match(/ctm_[a-z0-9]+/);
                if (match) {
                    paddleCustomerId = match[0];
                    console.log('Using existing Paddle customer:', paddleCustomerId);
                } else {
                    console.error('Could not extract customer ID from error:', customerError);
                    return { error: "Failed to setup customer account" };
                }
            } else {
                console.error('Customer creation failed:', customerError);
                return { error: "Failed to setup customer account" };
            }
        }

        // Step 2: Create Paddle checkout directly using API
        const paddleApiUrl = process.env.PADDLE_ENVIRONMENT === 'production' 
            ? 'https://api.paddle.com' 
            : 'https://sandbox-api.paddle.com';

        const checkoutResponse = await fetch(`${paddleApiUrl}/checkouts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [{ price_id: priceId, quantity: 1 }],
                customer_id: paddleCustomerId,
                custom_data: {
                    userId: session.userId,
                    plan,
                    email: user.email
                }
            })
        });

        if (!checkoutResponse.ok) {
            const errorData = await checkoutResponse.text();
            console.error('Paddle checkout creation failed:', errorData);
            return { error: "Failed to create checkout session" };
        }

        const checkoutData = await checkoutResponse.json();
        console.log('Paddle checkout created:', JSON.stringify(checkoutData, null, 2));

        // Paddle returns checkout URL in data.url
        const checkoutUrl = checkoutData.data?.url;
        
        if (!checkoutUrl) {
            console.error('No checkout URL in response:', checkoutData);
            return { error: "Failed to get checkout URL" };
        }

        console.log('Paddle checkout URL:', checkoutUrl);

        // Return the checkout URL
        return { 
            success: true, 
            checkoutUrl,
            useServerCheckout: true
        };
    } catch (e: any) {
        console.error("Create Pro subscription failed", e);
        return { error: e.message || "Failed to create checkout" };
    }
}

/**
 * Cancel Pro subscription
 * Cancels at end of billing period
 */
export async function cancelSubscriptionAction(subscriptionId: string) {
    const session = await verifySession();
    if (!session) return { error: "Unauthorized" };

    try {
        // Verify subscription belongs to user
        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });

        if (!subscription || subscription.userId !== session.userId) {
            return { error: "Subscription not found" };
        }

        if (!subscription.paddleSubscriptionId) {
            return { error: "Cannot cancel subscription - no Paddle subscription ID" };
        }

        // Cancel via Paddle API
        await paddle.subscriptions.cancel(subscription.paddleSubscriptionId, {
            effectiveFrom: 'next_billing_period' as any // Cancel at end of period
        });

        // Update local record
        await PaymentService.cancelSubscription(session.userId, subscriptionId);

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/billing");
        
        return { success: true, message: "Subscription will be canceled at end of billing period" };
    } catch (e) {
        console.error("Cancel subscription failed", e);
        return { error: "Failed to cancel subscription" };
    }
}

/**
 * Get subscription details for current user
 */
export async function getSubscriptionDetailsAction() {
    const session = await verifySession();
    if (!session) return { error: "Unauthorized" };

    try {
        const subscription = await prisma.subscription.findFirst({
            where: { 
                userId: session.userId,
                status: 'ACTIVE'
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!subscription) {
            return { subscription: null };
        }

        return {
            subscription: {
                id: subscription.id,
                plan: subscription.plan,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelledAt: subscription.cancelledAt,
            }
        };
    } catch (e) {
        console.error("Get subscription details failed", e);
        return { error: "Failed to fetch subscription" };
    }
}

/**
 * Get customer portal URL for managing subscription
 */
export async function getCustomerPortalUrlAction() {
    const session = await verifySession();
    if (!session) return { error: "Unauthorized" };

    try {
        const subscription = await prisma.subscription.findFirst({
            where: { 
                userId: session.userId,
                status: 'ACTIVE'
            }
        });

        if (!subscription?.paddleCustomerId) {
            return { error: "No active subscription found" };
        }

        // Generate customer portal URL
        // Note: Paddle doesn't have a direct API for this yet, 
        // redirect to billing page
        return {
            portalUrl: `${process.env.NEXTAUTH_URL}/dashboard/billing`
        };
    } catch (e) {
        console.error("Get portal URL failed", e);
        return { error: "Failed to generate portal URL" };
    }
}

// DEPRECATED - Legacy credit system (keeping for migration)
export async function buyCreditsAction(formData: FormData) {
    return { error: "Credit system has been deprecated. Please use the new pricing model." };
}

export async function upgradeSubscriptionAction(formData: FormData) {
    return { error: "Please use createProSubscriptionAction instead." };
}
