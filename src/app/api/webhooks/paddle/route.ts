import { NextRequest, NextResponse } from 'next/server';
import { PADDLE_WEBHOOK_SECRET, PADDLE_PRICE_IDS } from '@/lib/paddle';
import { PaymentService } from '@/lib/payment-service';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatusType, SubscriptionStatus } from '@prisma/client';
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
 * Atomically claim a webhook event (idempotency) by inserting a PROCESSING record.
 * If another process already claimed/completed it, we detect and skip.
 */
async function claimWebhookEvent(eventId: string, eventType: string): Promise<'claimed' | 'exists-processing' | 'exists-completed' | 'skip'> {
    try {
        // Attempt to create a PROCESSING record; unique(eventId) prevents duplicates
        const created = await prisma.webhookEvent.create({
            data: { eventId, eventType, status: 'PROCESSING' }
        });
        if (created) return 'claimed';
    } catch (error: any) {
        // If unique constraint violation, fetch existing to check status
        const existing = await prisma.webhookEvent.findUnique({ where: { eventId } }).catch(() => null);
        if (!existing) return 'skip';
        if (existing.status === 'COMPLETED') return 'exists-completed';
        return 'exists-processing';
    }
    return 'skip';
}

/**
 * Mark a previously claimed event as COMPLETED.
 */
async function completeWebhookEvent(eventId: string): Promise<void> {
    try {
        await prisma.webhookEvent.update({
            where: { eventId },
            data: { status: 'COMPLETED', processedAt: new Date() }
        });
    } catch (error) {
        console.warn('Could not mark event as completed:', error);
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

        // 4. Idempotency: atomically claim event at start
        if (eventId) {
            const claim = await claimWebhookEvent(eventId, eventType);
            if (claim === 'exists-completed') {
                console.log(`⏭️ Event ${eventId} already completed, skipping`);
                return NextResponse.json({ received: true, skipped: true });
            }
            if (claim === 'exists-processing') {
                console.log(`⏭️ Event ${eventId} already being processed, skipping`);
                return NextResponse.json({ received: true, skipped: true });
            }
            if (claim !== 'claimed') {
                console.log(`⏭️ Event ${eventId} could not be claimed, skipping`);
                return NextResponse.json({ received: true, skipped: true });
            }
        }

        // 5. Process event based on type
        switch (eventType) {
            // ----------------------------------------------------------------
            // TRANSACTION COMPLETED - One-time purchases & subscription payments
            // This is the SINGLE SOURCE OF TRUTH for payment success
            // ----------------------------------------------------------------
            case 'transaction.completed':
            case 'transaction.paid': {
                const customerId = eventData.customer_id;
                const customData = eventData.custom_data;
                const transactionId = eventData.id;
                const priceId = eventData.items?.[0]?.price?.id;
                const totalAmount = parseInt(eventData.details?.totals?.total || '0');
                const currency = eventData.currency_code || 'USD';
                const subscriptionId = eventData.subscription_id;
                const origin = eventData.origin; // 'subscription_recurring', 'web', etc.

                // Find user
                const user = await findUserFromWebhookData(customerId, customData);
                
                if (!user) {
                    console.error(`❌ Could not find user for transaction ${transactionId}`);
                    break;
                }

                // Update user's Paddle customer ID if not set
                if (customerId) {
                    await prisma.user.updateMany({
                        where: { id: user.id, paddleCustomerId: null },
                        data: { paddleCustomerId: customerId },
                    });
                }

                // Handle ONE-TIME EXAM purchase (pay-per-exam)
                if (priceId === PADDLE_PRICE_IDS.ONE_TIME_EXAM) {
                    // Record payment in transaction history
                    await prisma.payment.create({
                        data: {
                            teacherId: user.id,
                            amount: totalAmount,
                            currency,
                            status: 'COMPLETED',
                            type: 'ONE_TIME_EXAM',
                        }
                    });

                    // Grant one exam credit - this does NOT affect subscription
                    await PaymentService.grantOneTimeExam(user.id, 1);
                    console.log(`✅ Granted 1 exam credit to user ${user.id} (transaction: ${transactionId})`);
                    break;
                }

                // Handle SUBSCRIPTION payments (initial & renewals)
                if (subscriptionId || origin === 'subscription_recurring' || 
                    priceId === PADDLE_PRICE_IDS.PRO_MONTHLY || 
                    priceId === PADDLE_PRICE_IDS.PRO_YEARLY) {
                    
                    // Record subscription payment in transaction history
                    await prisma.payment.create({
                        data: {
                            teacherId: user.id,
                            amount: totalAmount,
                            currency,
                            status: 'COMPLETED',
                            type: 'SUBSCRIPTION',
                        }
                    });

                    // If this is a renewal, update the subscription period
                    if (subscriptionId) {
                        const subscription = await prisma.subscription.findFirst({
                            where: { paddleSubscriptionId: subscriptionId },
                        });

                        if (subscription) {
                            const billingPeriod = eventData.billing_period;
                            const periodEnd = billingPeriod?.ends_at 
                                ? new Date(billingPeriod.ends_at) 
                                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                            // Extend subscription period
                            await prisma.subscription.update({
                                where: { id: subscription.id },
                                data: {
                                    status: SubscriptionStatus.ACTIVE,
                                    currentPeriodStart: billingPeriod?.starts_at ? new Date(billingPeriod.starts_at) : new Date(),
                                    currentPeriodEnd: periodEnd,
                                },
                            });

                            // Ensure user stays PRO and period is extended
                            await prisma.user.update({
                                where: { id: user.id },
                                data: {
                                    planType: 'PRO',
                                    subscriptionStatus: SubscriptionStatusType.ACTIVE,
                                    currentPeriodEnd: periodEnd,
                                },
                            });

                            console.log(`✅ Extended subscription for user ${user.id} until ${periodEnd}`);
                        }
                    }

                    console.log(`✅ Recorded subscription payment for user ${user.id} (transaction: ${transactionId})`);
                    break;
                }

                // Unknown transaction type - just log it
                console.log(`ℹ️ Transaction ${transactionId} processed (type unknown, priceId: ${priceId})`);
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

                // Determine plan from price ID or custom data
                const plan = customData?.plan || getPlanFromPriceId(priceId || '');
                const periodStart = billingPeriod?.starts_at ? new Date(billingPeriod.starts_at) : new Date();
                const periodEnd = billingPeriod?.ends_at ? new Date(billingPeriod.ends_at) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                // Check if subscription already exists
                const existingSub = await prisma.subscription.findFirst({
                    where: { paddleSubscriptionId: subscriptionId },
                });

                if (existingSub) {
                    // Update existing subscription
                    await prisma.subscription.update({
                        where: { id: existingSub.id },
                        data: {
                            status: status === 'active' ? SubscriptionStatus.ACTIVE : status === 'canceled' ? SubscriptionStatus.CANCELLED : status === 'past_due' ? SubscriptionStatus.PAST_DUE : SubscriptionStatus.ACTIVE,
                            currentPeriodStart: periodStart,
                            currentPeriodEnd: periodEnd,
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
                        periodStart,
                        periodEnd,
                        amount
                    );
                    console.log(`✅ Created ${plan} subscription for user ${user.id}`);
                }

                // Update user with subscription info (single source of truth sync)
                await prisma.user.update({
                    where: { id: user.id },
                    data: { 
                        planType: 'PRO',
                        paddleCustomerId: customerId,
                        paddleSubscriptionId: subscriptionId,
                        subscriptionStatus: SubscriptionStatusType.ACTIVE,
                        currentPeriodEnd: periodEnd,
                    },
                });

                // Record subscription payment in transaction history
                await prisma.payment.create({
                    data: {
                        teacherId: user.id,
                        amount: amount,
                        currency: 'USD',
                        status: 'COMPLETED',
                        type: 'SUBSCRIPTION',
                    }
                });

                console.log(`✅ User ${user.id} upgraded to PRO with subscription ${subscriptionId}`);
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION UPDATED - Plan changes, renewals, billing cycle changes
            // This handles monthly <-> yearly switches WITHOUT creating new subscription
            // ----------------------------------------------------------------
            case 'subscription.updated': {
                const subscriptionId = eventData.id;
                const status = eventData.status;
                const billingPeriod = eventData.current_billing_period;
                const scheduledChange = eventData.scheduled_change;
                const priceId = eventData.items?.[0]?.price?.id;

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
                let newStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE;
                let userSubStatus: SubscriptionStatusType = SubscriptionStatusType.ACTIVE;
                
                if (status === 'canceled') {
                    newStatus = SubscriptionStatus.CANCELLED;
                    userSubStatus = SubscriptionStatusType.CANCELED;
                } else if (status === 'past_due') {
                    newStatus = SubscriptionStatus.PAST_DUE;
                    userSubStatus = SubscriptionStatusType.PAST_DUE;
                } else if (status === 'paused') {
                    newStatus = SubscriptionStatus.EXPIRED;
                    userSubStatus = SubscriptionStatusType.NONE;
                }

                // Determine new plan from price ID (for billing cycle changes)
                const newPlan = priceId ? getPlanFromPriceId(priceId) : subscription.plan;
                const periodEnd = billingPeriod?.ends_at ? new Date(billingPeriod.ends_at) : subscription.currentPeriodEnd;

                // Update subscription with date guards
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        status: newStatus,
                        plan: newPlan, // Update billing interval if changed
                        currentPeriodStart: billingPeriod?.starts_at ? new Date(billingPeriod.starts_at) : subscription.currentPeriodStart,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: scheduledChange?.action === 'cancel',
                    },
                });

                // Update user based on status
                if (newStatus === SubscriptionStatus.ACTIVE) {
                    await prisma.user.update({
                        where: { id: subscription.userId },
                        data: { 
                            planType: 'PRO',
                            subscriptionStatus: SubscriptionStatusType.ACTIVE,
                            currentPeriodEnd: periodEnd,
                        },
                    });
                } else if (newStatus === SubscriptionStatus.CANCELLED) {
                    // Keep Pro access until period end (grace period)
                    const periodEndDate = billingPeriod?.ends_at ? new Date(billingPeriod.ends_at) : new Date();
                    const hasGracePeriod = new Date() < periodEndDate;
                    
                    await prisma.user.update({
                        where: { id: subscription.userId },
                        data: { 
                            planType: hasGracePeriod ? 'PRO' : 'FREE', // Keep PRO during grace period
                            subscriptionStatus: SubscriptionStatusType.CANCELED,
                            currentPeriodEnd: periodEndDate,
                        },
                    });
                } else if (newStatus === SubscriptionStatus.PAST_DUE) {
                    await prisma.user.update({
                        where: { id: subscription.userId },
                        data: { 
                            subscriptionStatus: SubscriptionStatusType.PAST_DUE,
                            // Keep PRO access during past_due to allow payment retry
                        },
                    });
                } else if (newStatus === SubscriptionStatus.EXPIRED) {
                    await prisma.user.update({
                        where: { id: subscription.userId },
                        data: { 
                            planType: 'FREE',
                            subscriptionStatus: SubscriptionStatusType.NONE,
                            paddleSubscriptionId: null,
                            currentPeriodEnd: null,
                        },
                    });
                }

                console.log(`✅ Updated subscription ${subscriptionId} - status: ${newStatus}, plan: ${newPlan}`);
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION CANCELED - User keeps access until currentPeriodEnd
            // ----------------------------------------------------------------
            case 'subscription.canceled': {
                const subscriptionId = eventData.id;
                const effectiveAt = eventData.scheduled_change?.effective_at;
                const billingPeriod = eventData.current_billing_period;

                // Find and update subscription
                const subscription = await prisma.subscription.findFirst({
                    where: { paddleSubscriptionId: subscriptionId },
                });

                if (subscription) {
                    const periodEnd = billingPeriod?.ends_at 
                        ? new Date(billingPeriod.ends_at) 
                        : subscription.currentPeriodEnd;
                    
                    await prisma.subscription.update({
                        where: { id: subscription.id },
                        data: {
                            status: SubscriptionStatus.CANCELLED,
                            cancelledAt: new Date(),
                            cancelAtPeriodEnd: true,
                        },
                    });

                    // Determine if immediate or end-of-period cancellation
                    const isImmediate = !effectiveAt || new Date(effectiveAt) <= new Date();
                    const hasGracePeriod = periodEnd && new Date() < periodEnd;

                    if (isImmediate && !hasGracePeriod) {
                        // Immediate downgrade - no grace period
                        await prisma.user.update({
                            where: { id: subscription.userId },
                            data: { 
                                planType: 'FREE',
                                subscriptionStatus: SubscriptionStatusType.NONE,
                                paddleSubscriptionId: null,
                                currentPeriodEnd: null,
                            },
                        });
                        console.log(`⬇️ Immediately downgraded user ${subscription.userId}`);
                    } else {
                        // Grace period - keep Pro until period end
                        await prisma.user.update({
                            where: { id: subscription.userId },
                            data: { 
                                subscriptionStatus: SubscriptionStatusType.CANCELED,
                                currentPeriodEnd: periodEnd,
                                // planType stays PRO until period ends
                            },
                        });
                        console.log(`📅 User ${subscription.userId} will be downgraded at ${periodEnd}`);
                    }
                }

                console.log(`❌ Subscription ${subscriptionId} canceled`);
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION PAST DUE - Payment failed, user keeps access temporarily
            // ----------------------------------------------------------------
            case 'subscription.past_due': {
                const subscriptionId = eventData.id;

                const subscription = await prisma.subscription.findFirst({
                    where: { paddleSubscriptionId: subscriptionId },
                });

                if (subscription) {
                    await prisma.subscription.update({
                        where: { id: subscription.id },
                        data: { status: SubscriptionStatus.PAST_DUE },
                    });

                    // Update user status but keep PRO access to allow payment retry
                    await prisma.user.update({
                        where: { id: subscription.userId },
                        data: { subscriptionStatus: SubscriptionStatusType.PAST_DUE },
                    });
                }

                console.log(`⚠️ Subscription ${subscriptionId} is past due`);
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION PAUSED - Temporarily suspend access
            // ----------------------------------------------------------------
            case 'subscription.paused': {
                const subscriptionId = eventData.id;

                const subscription = await prisma.subscription.findFirst({
                    where: { paddleSubscriptionId: subscriptionId },
                });

                if (subscription) {
                    await prisma.subscription.update({
                        where: { id: subscription.id },
                        data: { status: SubscriptionStatus.EXPIRED }, // Use EXPIRED for paused
                    });

                    // Downgrade user while paused
                    await prisma.user.update({
                        where: { id: subscription.userId },
                        data: { 
                            planType: 'FREE',
                            subscriptionStatus: SubscriptionStatusType.NONE,
                        },
                    });
                }

                console.log(`⏸️ Subscription ${subscriptionId} paused`);
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION RESUMED - Restore access
            // ----------------------------------------------------------------
            case 'subscription.resumed': {
                const subscriptionId = eventData.id;
                const billingPeriod = eventData.current_billing_period;

                const subscription = await prisma.subscription.findFirst({
                    where: { paddleSubscriptionId: subscriptionId },
                });

                if (subscription) {
                    const periodEnd = billingPeriod?.ends_at 
                        ? new Date(billingPeriod.ends_at) 
                        : subscription.currentPeriodEnd;

                    await prisma.subscription.update({
                        where: { id: subscription.id },
                        data: { 
                            status: SubscriptionStatus.ACTIVE,
                            currentPeriodEnd: periodEnd,
                        },
                    });

                    // Upgrade user back to PRO
                    await prisma.user.update({
                        where: { id: subscription.userId },
                        data: { 
                            planType: 'PRO',
                            subscriptionStatus: SubscriptionStatusType.ACTIVE,
                            currentPeriodEnd: periodEnd,
                        },
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

        // 6. Mark event as completed (idempotency)
        if (eventId) {
            await completeWebhookEvent(eventId);
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
        
        // Classify retriable vs. non-retriable errors
        const msg = (error as Error).message || '';
        const isPrismaConn = msg.includes('P1001') || msg.includes('Connection') || msg.includes('timeout');
        const isNetwork = msg.includes('fetch failed') || msg.includes('ECONN') || msg.includes('ENET');
        const shouldRetry = isPrismaConn || isNetwork;

        return NextResponse.json(
            { error: 'Webhook processing failed', message: msg },
            { status: shouldRetry ? 500 : 200 }
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
