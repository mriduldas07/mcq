"use server";

import { verifySession } from "@/lib/session";
import { PaymentService } from "@/lib/payment-service";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { 
    PADDLE_PRICE_IDS, 
    getOrCreatePaddleCustomer, 
    createPaddleCheckout,
    cancelPaddleSubscription,
    validatePriceIds,
    verifyPaddleTransaction,
} from "@/lib/paddle";

// ============================================================================
// TYPES
// ============================================================================

interface PaymentResult {
    success?: boolean;
    error?: string;
    checkoutUrl?: string;
    transactionId?: string;
    message?: string;
}

// ============================================================================
// ONE-TIME EXAM PURCHASE ($1.99)
// ============================================================================

/**
 * Initialize Paddle checkout for one-time exam purchase
 * Creates a transaction and returns a checkout URL
 */
export async function purchaseOneTimeExamAction(): Promise<PaymentResult> {
    try {
        // 1. Verify user session
        const session = await verifySession();
        if (!session) {
            return { error: "Please log in to continue" };
        }

        // 2. Validate Paddle configuration
        const priceValidation = validatePriceIds();
        if (!priceValidation.valid) {
            console.error('Missing Paddle price IDs:', priceValidation.missing);
            return { error: "Payment system not fully configured. Please contact support." };
        }

        // 3. Get user details
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { 
                id: true,
                email: true, 
                name: true,
                paddleCustomerId: true,
            }
        });

        if (!user?.email) {
            return { error: "User account not found or email missing" };
        }

        // 4. Get or create Paddle customer
        let paddleCustomerId = user.paddleCustomerId;
        
        if (!paddleCustomerId) {
            const customerResult = await getOrCreatePaddleCustomer(user.email, user.name || undefined);
            
            if (!customerResult.success || !customerResult.customerId) {
                console.error('Failed to create Paddle customer:', customerResult.error);
                return { error: "Unable to set up payment. Please try again." };
            }
            
            paddleCustomerId = customerResult.customerId;
            
            // Store Paddle customer ID for future use
            await prisma.user.update({
                where: { id: user.id },
                data: { paddleCustomerId },
            });
        }

        // 5. Create checkout session
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        
        const checkoutResult = await createPaddleCheckout({
            customerId: paddleCustomerId,
            priceId: PADDLE_PRICE_IDS.ONE_TIME_EXAM,
            quantity: 1,
            customData: {
                userId: user.id,
                userEmail: user.email,
                purchaseType: 'ONE_TIME_EXAM',
                timestamp: new Date().toISOString(),
            },
            successUrl: `${baseUrl}/dashboard/billing?success=true&type=exam`,
        });

        if (!checkoutResult.success || !checkoutResult.checkoutUrl) {
            console.error('Failed to create checkout:', checkoutResult.error);
            return { error: checkoutResult.error || "Unable to create checkout. Please try again." };
        }

        console.log(`✅ Created one-time exam checkout for user ${user.id}`);
        
        return { 
            success: true, 
            checkoutUrl: checkoutResult.checkoutUrl,
            transactionId: checkoutResult.transactionId,
        };

    } catch (error: any) {
        console.error("Purchase one-time exam error:", error);
        return { error: "An unexpected error occurred. Please try again." };
    }
}

// ============================================================================
// PRO SUBSCRIPTION ($11.99/month or $99/year)
// ============================================================================

/**
 * Initialize Paddle checkout for Pro subscription
 * Creates a subscription checkout and returns URL
 */
export async function createProSubscriptionAction(
    plan: 'MONTHLY' | 'YEARLY'
): Promise<PaymentResult> {
    try {
        // 1. Verify user session
        const session = await verifySession();
        if (!session) {
            return { error: "Please log in to continue" };
        }

        // 2. Validate plan parameter
        if (plan !== 'MONTHLY' && plan !== 'YEARLY') {
            return { error: "Invalid plan selected" };
        }

        // 3. Validate Paddle configuration
        const priceValidation = validatePriceIds();
        if (!priceValidation.valid) {
            console.error('Missing Paddle price IDs:', priceValidation.missing);
            return { error: "Payment system not fully configured. Please contact support." };
        }

        // 4. Get user details
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { 
                id: true,
                email: true, 
                name: true,
                paddleCustomerId: true,
            }
        });

        if (!user?.email) {
            return { error: "User account not found or email missing" };
        }

        // 5. Check if user already has an active subscription
        const hasActiveSub = await PaymentService.hasActiveProSubscription(session.userId);
        if (hasActiveSub) {
            return { error: "You already have an active Pro subscription" };
        }

        // 6. Get or create Paddle customer
        let paddleCustomerId = user.paddleCustomerId;
        
        if (!paddleCustomerId) {
            const customerResult = await getOrCreatePaddleCustomer(user.email, user.name || undefined);
            
            if (!customerResult.success || !customerResult.customerId) {
                console.error('Failed to create Paddle customer:', customerResult.error);
                return { error: "Unable to set up payment. Please try again." };
            }
            
            paddleCustomerId = customerResult.customerId;
            
            // Store Paddle customer ID
            await prisma.user.update({
                where: { id: user.id },
                data: { paddleCustomerId },
            });
        }

        // 7. Create checkout session
        const priceId = plan === 'MONTHLY' 
            ? PADDLE_PRICE_IDS.PRO_MONTHLY 
            : PADDLE_PRICE_IDS.PRO_YEARLY;
            
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        
        const checkoutResult = await createPaddleCheckout({
            customerId: paddleCustomerId,
            priceId,
            quantity: 1,
            customData: {
                userId: user.id,
                userEmail: user.email,
                purchaseType: 'PRO_SUBSCRIPTION',
                plan,
                timestamp: new Date().toISOString(),
            },
            successUrl: `${baseUrl}/dashboard/billing?success=true&type=subscription&plan=${plan.toLowerCase()}`,
        });

        if (!checkoutResult.success || !checkoutResult.checkoutUrl) {
            console.error('Failed to create checkout:', checkoutResult.error);
            return { error: checkoutResult.error || "Unable to create checkout. Please try again." };
        }

        console.log(`✅ Created Pro ${plan} subscription checkout for user ${user.id}`);
        
        return { 
            success: true, 
            checkoutUrl: checkoutResult.checkoutUrl,
            transactionId: checkoutResult.transactionId,
        };

    } catch (error: any) {
        console.error("Create Pro subscription error:", error);
        return { error: "An unexpected error occurred. Please try again." };
    }
}

// ============================================================================
// CANCEL SUBSCRIPTION
// ============================================================================

/**
 * Cancel Pro subscription
 * Cancels at end of billing period (user keeps access until then)
 */
export async function cancelSubscriptionAction(
    subscriptionId: string
): Promise<PaymentResult> {
    try {
        // 1. Verify user session
        const session = await verifySession();
        if (!session) {
            return { error: "Please log in to continue" };
        }

        // 2. Verify subscription belongs to user
        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });

        console.log(`🔍 Cancel request for subscription: ${subscriptionId}`, {
            found: !!subscription,
            paddleId: subscription?.paddleSubscriptionId,
            status: subscription?.status,
        });

        if (!subscription) {
            return { error: "Subscription not found" };
        }

        if (subscription.userId !== session.userId) {
            return { error: "You don't have permission to cancel this subscription" };
        }

        if (subscription.status === 'CANCELLED') {
            return { error: "Subscription is already cancelled" };
        }

        // If no Paddle subscription ID, just mark as cancelled locally
        // This can happen if subscription was created before proper Paddle integration
        if (!subscription.paddleSubscriptionId) {
            console.warn(`⚠️ Subscription ${subscriptionId} has no paddleSubscriptionId - cancelling locally only`);
            
            // Update local record
            await PaymentService.cancelSubscription(session.userId, subscriptionId);
            
            // Revalidate pages
            revalidatePath("/dashboard");
            revalidatePath("/dashboard/billing");
            
            return { 
                success: true, 
                message: "Subscription cancelled successfully." 
            };
        }

        // 3. Cancel via Paddle API
        console.log(`📤 Sending cancel request to Paddle for: ${subscription.paddleSubscriptionId}`);
        
        const cancelResult = await cancelPaddleSubscription(
            subscription.paddleSubscriptionId,
            'next_billing_period'
        );

        if (!cancelResult.success) {
            console.error('❌ Failed to cancel via Paddle:', cancelResult.error);
            
            // If Paddle says subscription is already cancelled or not found, still update locally
            if (cancelResult.error?.includes('not found') || 
                cancelResult.error?.includes('already') ||
                cancelResult.error?.includes('canceled')) {
                console.log('⚠️ Paddle error suggests subscription may already be cancelled - updating local record');
                await PaymentService.cancelSubscription(session.userId, subscriptionId);
                revalidatePath("/dashboard");
                revalidatePath("/dashboard/billing");
                return { 
                    success: true, 
                    message: "Subscription cancelled." 
                };
            }
            
            return { error: cancelResult.error || "Unable to cancel subscription. Please try again." };
        }

        // 4. Update local record
        await PaymentService.cancelSubscription(session.userId, subscriptionId);

        // 5. Revalidate pages
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/billing");
        
        console.log(`✅ Cancelled subscription ${subscriptionId} for user ${session.userId}`);
        
        return { 
            success: true, 
            message: "Subscription cancelled. You'll retain Pro access until the end of your billing period." 
        };

    } catch (error: any) {
        console.error("Cancel subscription error:", error);
        return { error: "An unexpected error occurred. Please try again." };
    }
}

// ============================================================================
// GET SUBSCRIPTION DETAILS
// ============================================================================

/**
 * Get subscription details for current user
 */
export async function getSubscriptionDetailsAction() {
    try {
        const session = await verifySession();
        if (!session) {
            return { error: "Unauthorized" };
        }

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
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                cancelledAt: subscription.cancelledAt,
                amount: subscription.amount,
                currency: subscription.currency,
            }
        };
    } catch (error: any) {
        console.error("Get subscription details error:", error);
        return { error: "Failed to fetch subscription details" };
    }
}

// ============================================================================
// VERIFY PAYMENT SUCCESS (Client-side callback verification)
// ============================================================================

/**
 * Verify a completed payment transaction
 * Called after user returns from Paddle checkout
 */
export async function verifyPaymentSuccessAction(
    transactionId: string
): Promise<{ success: boolean; verified: boolean; error?: string }> {
    try {
        const session = await verifySession();
        if (!session) {
            return { success: false, verified: false, error: "Unauthorized" };
        }

        // Verify with Paddle API
        const verifyResult = await verifyPaddleTransaction(transactionId);
        
        if (!verifyResult.success) {
            return { 
                success: false, 
                verified: false, 
                error: verifyResult.error || "Unable to verify transaction" 
            };
        }

        // Check if transaction belongs to this user
        if (verifyResult.customData?.userId !== session.userId) {
            return { 
                success: false, 
                verified: false, 
                error: "Transaction does not belong to this user" 
            };
        }

        return {
            success: true,
            verified: verifyResult.completed,
        };

    } catch (error: any) {
        console.error("Verify payment error:", error);
        return { success: false, verified: false, error: "Verification failed" };
    }
}

// ============================================================================
// GET USER BILLING STATUS
// ============================================================================

/**
 * Get comprehensive billing status for current user
 */
export async function getUserBillingStatusAction() {
    try {
        const session = await verifySession();
        if (!session) {
            return { error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                planType: true,
                freeExamsUsed: true,
                oneTimeExamsRemaining: true,
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    orderBy: { currentPeriodEnd: 'desc' },
                    take: 1,
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!user) {
            return { error: "User not found" };
        }

        const activeSubscription = user.subscriptions[0] || null;
        const isPro = activeSubscription && new Date() <= activeSubscription.currentPeriodEnd;

        return {
            isPro,
            planType: user.planType,
            freeExamsRemaining: Math.max(0, 3 - user.freeExamsUsed),
            oneTimeExamsRemaining: user.oneTimeExamsRemaining,
            subscription: activeSubscription ? {
                id: activeSubscription.id,
                plan: activeSubscription.plan,
                status: activeSubscription.status,
                currentPeriodEnd: activeSubscription.currentPeriodEnd,
                cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
            } : null,
            recentPayments: user.payments.map(p => ({
                id: p.id,
                type: p.type,
                status: p.status,
                amount: p.amount,
                currency: p.currency,
                createdAt: p.createdAt,
            })),
        };

    } catch (error: any) {
        console.error("Get billing status error:", error);
        return { error: "Failed to fetch billing status" };
    }
}

// ============================================================================
// DEPRECATED ACTIONS (kept for backward compatibility)
// ============================================================================

export async function buyCreditsAction(formData: FormData) {
    return { error: "Credit system has been deprecated. Please use the new pricing model." };
}

export async function upgradeSubscriptionAction(formData: FormData) {
    return { error: "Please use createProSubscriptionAction instead." };
}

export async function getCustomerPortalUrlAction() {
    // Paddle doesn't have a self-service customer portal like Stripe
    // Redirect to our billing page instead
    return {
        portalUrl: `${process.env.NEXTAUTH_URL || ''}/dashboard/billing`
    };
}
