import { NextRequest, NextResponse } from 'next/server';
import { PADDLE_WEBHOOK_SECRET, PADDLE_PRICE_IDS } from '@/lib/paddle';
import { PaymentService } from '@/lib/payment-service';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ============================================================================
// PADDLE WEBHOOK HANDLER
// Production-ready with signature verification and idempotency
// ============================================================================

/**
 * Verify Paddle webhook signature using HMAC-SHA256
 * https://developer.paddle.com/webhooks/signature-verification
 */
function verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!PADDLE_WEBHOOK_SECRET) {
        console.warn('⚠️ PADDLE_WEBHOOK_SECRET not configured - skipping verification');
        return process.env.NODE_ENV !== 'production'; // Only allow in dev
    }

    if (!signature) {
        console.error('❌ No Paddle-Signature header provided');
        return false;
    }

    try {
        // Paddle signature format: "ts=timestamp;h1=signature"
        const parts = signature.split(';');
        const timestampPart = parts.find(p => p.startsWith('ts='));
        const signaturePart = parts.find(p => p.startsWith('h1='));

        if (!timestampPart || !signaturePart) {
            console.error('❌ Invalid signature format');
            return false;
        }

        const timestamp = timestampPart.substring(3);
        const receivedSignature = signaturePart.substring(3);

        // Check timestamp is recent (within 5 minutes) to prevent replay attacks
        const timestampAge = Math.abs(Date.now() / 1000 - parseInt(timestamp));
        if (timestampAge > 300) {
            console.error('❌ Webhook timestamp too old:', timestampAge, 'seconds');
            return false;
        }

        // Paddle signs: timestamp + ":" + rawBody
        const signedPayload = `${timestamp}:${rawBody}`;
        
        // Calculate expected signature
        const hmac = crypto.createHmac('sha256', PADDLE_WEBHOOK_SECRET);
        const expectedSignature = hmac.update(signedPayload).digest('hex');

        // Timing-safe comparison
        if (receivedSignature.length !== expectedSignature.length) {
            console.error('❌ Signature length mismatch');
            return false;
        }

        const isValid = crypto.timingSafeEqual(
            Buffer.from(receivedSignature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );

        if (!isValid) {
            console.error('❌ Signature mismatch');
        }

        return isValid;

    } catch (error) {
        console.error('❌ Signature verification error:', error);
        return false;
    }
}

/**
 * Check if event has already been processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
    // Check if we've seen this event before
    const existing = await prisma.webhookEvent.findUnique({
        where: { eventId },
    }).catch(() => null); // Table might not exist yet

    return !!existing;
}

/**
 * Mark event as processed
 */
async function markEventProcessed(eventId: string, eventType: string): Promise<void> {
    try {
        await prisma.webhookEvent.create({
            data: {
                eventId,
                eventType,
                processedAt: new Date(),
            },
        });
    } catch (error) {
        // Ignore if table doesn't exist or duplicate
        console.warn('Could not mark event as processed:', error);
    }
}

/**
 * Find user by Paddle customer ID or custom data
 */
async function findUserFromWebhookData(
    customerId?: string,
    customData?: { userId?: string; userEmail?: string }
): Promise<{ id: string; email: string } | null> {
    
    // Try to find by custom data userId first (most reliable)
    if (customData?.userId) {
        const user = await prisma.user.findUnique({
            where: { id: customData.userId },
            select: { id: true, email: true },
        });
        if (user) return user;
    }

    // Try to find by Paddle customer ID
    if (customerId) {
        const user = await prisma.user.findFirst({
            where: { paddleCustomerId: customerId },
            select: { id: true, email: true },
        });
        if (user) return user;
    }

    // Try to find by email from custom data
    if (customData?.userEmail) {
        const user = await prisma.user.findUnique({
            where: { email: customData.userEmail },
            select: { id: true, email: true },
        });
        if (user) return user;
    }

    return null;
}

/**
 * Determine subscription plan from price ID
 */
function getPlanFromPriceId(priceId: string): 'MONTHLY' | 'YEARLY' {
    if (priceId === PADDLE_PRICE_IDS.PRO_YEARLY) {
        return 'YEARLY';
    }
    return 'MONTHLY';
}

// ============================================================================
// WEBHOOK ENDPOINT
// ============================================================================

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    
    try {
        // 1. Get raw body for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get('paddle-signature') || '';

        // 2. Verify webhook signature
        if (!verifyWebhookSignature(rawBody, signature)) {
            console.error('❌ Webhook signature verification failed');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // 3. Parse event
        const event = JSON.parse(rawBody);
        const eventId = event.event_id;
        const eventType = event.event_type;
        const eventData = event.data;

        console.log(`📥 Paddle webhook: ${eventType} (${eventId})`);

        // 4. Check idempotency (skip if already processed)
        if (eventId && await isEventProcessed(eventId)) {
            console.log(`⏭️ Event ${eventId} already processed, skipping`);
            return NextResponse.json({ received: true, skipped: true });
        }

        // 5. Process event based on type
        switch (eventType) {
            // ----------------------------------------------------------------
            // TRANSACTION COMPLETED - One-time purchases
            // ----------------------------------------------------------------
            case 'transaction.completed': {
                const customerId = eventData.customer_id;
                const customData = eventData.custom_data;
                const transactionId = eventData.id;
                const priceId = eventData.items?.[0]?.price?.id;
                const totalAmount = parseInt(eventData.details?.totals?.total || '0');
                const currency = eventData.currency_code || 'USD';

                // Only process one-time exam purchases
                if (priceId !== PADDLE_PRICE_IDS.ONE_TIME_EXAM) {
                    console.log(`ℹ️ Transaction ${transactionId} is not a one-time exam purchase`);
                    break;
                }

                // Find user
                const user = await findUserFromWebhookData(customerId, customData);
                
                if (!user) {
                    console.error(`❌ Could not find user for transaction ${transactionId}`);
                    // Don't fail - return 200 to prevent retries, but log error
                    break;
                }

                // Update user's Paddle customer ID if not set
                await prisma.user.update({
                    where: { id: user.id },
                    data: { paddleCustomerId: customerId },
                }).catch(() => {}); // Ignore if already set

                // Record payment
                await prisma.payment.create({
                    data: {
                        teacherId: user.id,
                        amount: totalAmount,
                        currency,
                        status: 'COMPLETED',
                        type: 'ONE_TIME_EXAM',
                    }
                });

                // Grant one exam credit
                await PaymentService.grantOneTimeExam(user.id, 1);

                console.log(`✅ Granted 1 exam credit to user ${user.id} (transaction: ${transactionId})`);
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION CREATED - New Pro subscription
            // ----------------------------------------------------------------
            case 'subscription.created':
            case 'subscription.activated': {
                const subscriptionId = eventData.id;
                const customerId = eventData.customer_id;
                const customData = eventData.custom_data;
                const status = eventData.status;
                const priceId = eventData.items?.[0]?.price?.id;
                const amount = parseInt(eventData.items?.[0]?.price?.unit_price?.amount || '0');
                const billingPeriod = eventData.current_billing_period;

                // Find user
                const user = await findUserFromWebhookData(customerId, customData);
                
                if (!user) {
                    console.error(`❌ Could not find user for subscription ${subscriptionId}`);
                    break;
                }

                // Update user's Paddle customer ID
                await prisma.user.update({
                    where: { id: user.id },
                    data: { paddleCustomerId: customerId },
                }).catch(() => {});

                // Determine plan from price ID or custom data
                const plan = customData?.plan || getPlanFromPriceId(priceId || '');

                // Check if subscription already exists
                const existingSub = await prisma.subscription.findFirst({
                    where: { paddleSubscriptionId: subscriptionId },
                });

                if (existingSub) {
                    // Update existing subscription
                    await prisma.subscription.update({
                        where: { id: existingSub.id },
                        data: {
                            status: status === 'active' ? 'ACTIVE' : 'ACTIVE',
                            currentPeriodStart: new Date(billingPeriod?.starts_at),
                            currentPeriodEnd: new Date(billingPeriod?.ends_at),
                        },
                    });
                    console.log(`✅ Updated subscription ${subscriptionId} for user ${user.id}`);
                } else {
                    // Create new subscription
                    await PaymentService.createSubscription(
                        user.id,
                        plan,
                        subscriptionId,
                        customerId,
                        new Date(billingPeriod?.starts_at || new Date()),
                        new Date(billingPeriod?.ends_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                        amount
                    );
                    console.log(`✅ Created ${plan} subscription for user ${user.id}`);
                }

                // Upgrade user to PRO
                await prisma.user.update({
                    where: { id: user.id },
                    data: { planType: 'PRO' },
                });

                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION UPDATED - Plan changes, renewals
            // ----------------------------------------------------------------
            case 'subscription.updated': {
                const subscriptionId = eventData.id;
                const status = eventData.status;
                const billingPeriod = eventData.current_billing_period;
                const scheduledChange = eventData.scheduled_change;

                // Find subscription
                const subscription = await prisma.subscription.findFirst({
                    where: { paddleSubscriptionId: subscriptionId },
                    include: { user: true },
                });

                if (!subscription) {
                    console.warn(`⚠️ Subscription ${subscriptionId} not found in database`);
                    break;
                }

                // Map Paddle status to our status
                let newStatus: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED' = 'ACTIVE';
                if (status === 'canceled') newStatus = 'CANCELLED';
                else if (status === 'past_due') newStatus = 'PAST_DUE';
                else if (status === 'paused') newStatus = 'EXPIRED';

                // Update subscription
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        status: newStatus,
                        currentPeriodStart: billingPeriod?.starts_at ? new Date(billingPeriod.starts_at) : undefined,
                        currentPeriodEnd: billingPeriod?.ends_at ? new Date(billingPeriod.ends_at) : undefined,
                        cancelAtPeriodEnd: scheduledChange?.action === 'cancel',
                    },
                });

                // Update user plan type based on status
                if (newStatus === 'ACTIVE') {
                    await prisma.user.update({
                        where: { id: subscription.userId },
                        data: { planType: 'PRO' },
                    });
                } else if (newStatus === 'CANCELLED' || newStatus === 'EXPIRED') {
                    // Check if period has ended
                    const periodEnd = billingPeriod?.ends_at ? new Date(billingPeriod.ends_at) : new Date();
                    if (new Date() >= periodEnd) {
                        await prisma.user.update({
                            where: { id: subscription.userId },
                            data: { planType: 'FREE' },
                        });
                    }
                }

                console.log(`✅ Updated subscription ${subscriptionId} - status: ${newStatus}`);
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION CANCELED
            // ----------------------------------------------------------------
            case 'subscription.canceled': {
                const subscriptionId = eventData.id;
                const effectiveAt = eventData.scheduled_change?.effective_at;

                // Find and update subscription
                const subscription = await prisma.subscription.findFirst({
                    where: { paddleSubscriptionId: subscriptionId },
                });

                if (subscription) {
                    await prisma.subscription.update({
                        where: { id: subscription.id },
                        data: {
                            status: 'CANCELLED',
                            cancelledAt: new Date(),
                            cancelAtPeriodEnd: true,
                        },
                    });

                    // If immediate cancellation, downgrade now
                    if (!effectiveAt || new Date(effectiveAt) <= new Date()) {
                        await prisma.user.update({
                            where: { id: subscription.userId },
                            data: { planType: 'FREE' },
                        });
                        console.log(`⬇️ Immediately downgraded user ${subscription.userId}`);
                    } else {
                        console.log(`📅 User ${subscription.userId} will be downgraded at ${effectiveAt}`);
                    }
                }

                console.log(`❌ Subscription ${subscriptionId} canceled`);
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION PAST DUE - Payment failed
            // ----------------------------------------------------------------
            case 'subscription.past_due': {
                const subscriptionId = eventData.id;

                await prisma.subscription.updateMany({
                    where: { paddleSubscriptionId: subscriptionId },
                    data: { status: 'PAST_DUE' },
                });

                console.log(`⚠️ Subscription ${subscriptionId} is past due`);
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION PAUSED
            // ----------------------------------------------------------------
            case 'subscription.paused': {
                const subscriptionId = eventData.id;

                const subscription = await prisma.subscription.findFirst({
                    where: { paddleSubscriptionId: subscriptionId },
                });

                if (subscription) {
                    await prisma.subscription.update({
                        where: { id: subscription.id },
                        data: { status: 'EXPIRED' }, // Use EXPIRED for paused
                    });

                    // Downgrade user while paused
                    await prisma.user.update({
                        where: { id: subscription.userId },
                        data: { planType: 'FREE' },
                    });
                }

                console.log(`⏸️ Subscription ${subscriptionId} paused`);
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION RESUMED
            // ----------------------------------------------------------------
            case 'subscription.resumed': {
                const subscriptionId = eventData.id;

                const subscription = await prisma.subscription.findFirst({
                    where: { paddleSubscriptionId: subscriptionId },
                });

                if (subscription) {
                    await prisma.subscription.update({
                        where: { id: subscription.id },
                        data: { status: 'ACTIVE' },
                    });

                    // Upgrade user back to PRO
                    await prisma.user.update({
                        where: { id: subscription.userId },
                        data: { planType: 'PRO' },
                    });
                }

                console.log(`▶️ Subscription ${subscriptionId} resumed`);
                break;
            }

            // ----------------------------------------------------------------
            // OTHER EVENTS - Log but don't process
            // ----------------------------------------------------------------
            default:
                console.log(`ℹ️ Unhandled webhook event: ${eventType}`);
        }

        // 6. Mark event as processed (idempotency)
        if (eventId) {
            await markEventProcessed(eventId, eventType);
        }

        const duration = Date.now() - startTime;
        console.log(`✅ Webhook processed in ${duration}ms`);

        return NextResponse.json({ 
            received: true, 
            eventType,
            duration: `${duration}ms`,
        });

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        
        // Return 200 to prevent Paddle from retrying (we logged the error)
        // In production, you might want to return 500 for retriable errors
        return NextResponse.json(
            { error: 'Webhook processing failed', message: (error as Error).message },
            { status: 200 } // Return 200 to acknowledge receipt
        );
    }
}

// ============================================================================
// HEALTH CHECK ENDPOINT (GET)
// ============================================================================

export async function GET() {
    return NextResponse.json({ 
        status: 'ok',
        webhook: 'paddle',
        timestamp: new Date().toISOString(),
    });
}
