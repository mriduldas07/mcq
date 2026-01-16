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
            // Try to find existing customer by email
            const customersResponse = await paddle.customers.list({
                email: user.email
            });
            
            if (customersResponse.data && customersResponse.data.length > 0) {
                paddleCustomerId = customersResponse.data[0].id;
                console.log('Found existing Paddle customer:', paddleCustomerId);
            } else {
                // Create new customer
                const newCustomer = await paddle.customers.create({
                    email: user.email,
                    name: user.name || undefined
                });
                paddleCustomerId = newCustomer.id;
                console.log('Created new Paddle customer:', paddleCustomerId);
            }
        } catch (customerError: any) {
            console.error('Customer creation/lookup failed:', customerError);
            return { error: "Failed to setup customer account" };
        }

        // Step 2: Create transaction with customer_id
        const checkoutData = {
            items: [{ priceId: PADDLE_PRICE_IDS.ONE_TIME_EXAM, quantity: 1 }],
            customerId: paddleCustomerId,
            customData: {
                userId: session.userId,
                email: user.email            },
            checkout: {
                url: process.env.NEXTAUTH_URL!            }
        };

        console.log('Creating Paddle transaction with data:', JSON.stringify(checkoutData, null, 2));

        const transaction = await paddle.transactions.create(checkoutData as any);
        
        console.log('Transaction created:', JSON.stringify(transaction, null, 2));
        console.log('Transaction status:', transaction.status);

        // Get transaction ID to build checkout URL
        const transactionId = transaction.id;
        
        // Build Paddle's hosted checkout URL
        const paddleEnvironment = process.env.PADDLE_ENVIRONMENT === 'production' ? 'buy' : 'sandbox-buy';
        const checkoutUrl = `https://${paddleEnvironment}.paddle.com/checkout?_ptxn=${transactionId}`;
        
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
            // Try to find existing customer by email
            const customersResponse = await paddle.customers.list({
                email: user.email
            });
            
            if (customersResponse.data && customersResponse.data.length > 0) {
                paddleCustomerId = customersResponse.data[0].id;
                console.log('Found existing Paddle customer:', paddleCustomerId);
            } else {
                // Create new customer
                const newCustomer = await paddle.customers.create({
                    email: user.email,
                    name: user.name || undefined
                });
                paddleCustomerId = newCustomer.id;
                console.log('Created new Paddle customer:', paddleCustomerId);
            }
        } catch (customerError: any) {
            console.error('Customer creation/lookup failed:', customerError);
            return { error: "Failed to setup customer account" };
        }

        // Step 2: Create transaction with customer_id
        const checkoutData = {
            items: [{ priceId, quantity: 1 }],
            customerId: paddleCustomerId,
            customData: {
                userId: session.userId,
                plan,
                email: user.email
            },
            checkout: {
                url: process.env.NEXTAUTH_URL!
            }
        };

        console.log('Creating Paddle transaction with data:', JSON.stringify(checkoutData, null, 2));

        const transaction = await paddle.transactions.create(checkoutData as any);

        console.log('Transaction created:', JSON.stringify(transaction, null, 2));
        console.log('Transaction status:', transaction.status);

        // Get transaction ID to build checkout URL
        const transactionId = transaction.id;
        
        // Build Paddle's hosted checkout URL
        const paddleEnvironment = process.env.PADDLE_ENVIRONMENT === 'production' ? 'buy' : 'sandbox-buy';
        const checkoutUrl = `https://${paddleEnvironment}.paddle.com/checkout?_ptxn=${transactionId}`;
        
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
