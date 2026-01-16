import { NextRequest, NextResponse } from 'next/server';
import { paddle, PADDLE_WEBHOOK_SECRET } from '@/lib/paddle';
import { PaymentService } from '@/lib/payment-service';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Paddle Webhook Handler
 * 
 * Handles all Paddle webhook events:
 * - transaction.completed (one-time purchases)
 * - subscription.created (new Pro subscriptions)
 * - subscription.updated (subscription changes)
 * - subscription.canceled (subscription cancellations)
 * - subscription.payment_failed (failed payments)
 */

// Verify Paddle webhook signature
function verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!PADDLE_WEBHOOK_SECRET) {
        console.error('❌ PADDLE_WEBHOOK_SECRET not configured');
        return false;
    }

    if (!signature) {
        console.error('❌ No signature provided');
        return false;
    }

    try {
        console.log('🔍 Signature received:', signature);
        console.log('🔍 Webhook secret length:', PADDLE_WEBHOOK_SECRET.length);
        
        // Paddle signature format: "ts=timestamp;h1=signature"
        const parts = signature.split(';');
        const signaturePart = parts.find(part => part.startsWith('h1='));
        const timestampPart = parts.find(part => part.startsWith('ts='));
        
        if (!signaturePart || !timestampPart) {
            console.error('❌ Invalid signature format - missing h1 or ts');
            console.error('Parts:', parts);
            return false;
        }

        const receivedSignature = signaturePart.substring(3);
        const timestamp = timestampPart.substring(3);
        
        console.log('🔍 Timestamp:', timestamp);
        console.log('🔍 Received signature:', receivedSignature);
        
        // Paddle signs: timestamp + ":" + rawBody
        const signedPayload = timestamp + ':' + rawBody;
        
        // Calculate expected signature
        const hmac = crypto.createHmac('sha256', PADDLE_WEBHOOK_SECRET);
        const expectedSignature = hmac.update(signedPayload).digest('hex');
        
        console.log('🔍 Expected signature:', expectedSignature);
        console.log('🔍 Signatures match:', receivedSignature === expectedSignature);
        
        // Compare signatures (lengths should now match)
        if (receivedSignature.length !== expectedSignature.length) {
            console.error(`❌ Signature length mismatch: received=${receivedSignature.length}, expected=${expectedSignature.length}`);
            return false;
        }

        return crypto.timingSafeEqual(
            Buffer.from(receivedSignature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        console.error('❌ Signature verification error:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get raw body for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get('paddle-signature') || '';

        console.log('📥 Webhook received with signature:', signature ? 'present' : 'missing');

        // Verify webhook signature (skip in development if no secret)
        if (PADDLE_WEBHOOK_SECRET) {
            if (!verifyWebhookSignature(rawBody, signature)) {
                console.error('❌ Invalid webhook signature');
                return NextResponse.json(
                    { error: 'Invalid signature' },
                    { status: 401 }
                );
            }
            console.log('✅ Webhook signature verified');
        } else {
            console.warn('⚠️ Skipping signature verification (no PADDLE_WEBHOOK_SECRET)');
        }

        const event = JSON.parse(rawBody);
        const eventType = event.event_type;
        const eventData = event.data;

        console.log(`📥 Paddle webhook received: ${eventType}`);

        switch (eventType) {
            case 'transaction.completed': {
                // Handle one-time exam purchase
                const customerId = eventData.customer_id;
                const amount = parseInt(eventData.details.totals.total);
                const transactionId = eventData.id;
                const priceId = eventData.items?.[0]?.price?.id;

                // Find user by Paddle customer ID
                const user = await prisma.user.findFirst({
                    where: { 
                        subscriptions: {
                            some: {
                                paddleCustomerId: customerId
                            }
                        }
                    }
                });

                if (!user) {
                    // Try to find by custom data if included
                    const customData = eventData.custom_data;
                    if (customData?.userId) {
                        const foundUser = await prisma.user.findUnique({
                            where: { id: customData.userId }
                        });

                        if (foundUser) {
                            // Record payment
                            await prisma.payment.create({
                                data: {
                                    teacherId: foundUser.id,
                                    amount,
                                    currency: eventData.currency_code || 'USD',
                                    status: 'COMPLETED',
                                    type: 'ONE_TIME_EXAM',
                                }
                            });

                            // Grant one-time exam
                            await PaymentService.grantOneTimeExam(foundUser.id, 1);
                            
                            console.log(`✅ Granted 1 exam to user ${foundUser.id}`);
                        }
                    }
                } else {
                    // Record payment
                    await prisma.payment.create({
                        data: {
                            teacherId: user.id,
                            amount,
                            currency: eventData.currency_code || 'USD',
                            status: 'COMPLETED',
                            type: 'ONE_TIME_EXAM',
                        }
                    });

                    // Grant one-time exam
                    await PaymentService.grantOneTimeExam(user.id, 1);
                    
                    console.log(`✅ Granted 1 exam to user ${user.id}`);
                }

                break;
            }

            case 'subscription.created': {
                // Handle new Pro subscription
                const customerId = eventData.customer_id;
                const subscriptionId = eventData.id;
                const status = eventData.status;
                const currentPeriodStart = new Date(eventData.current_billing_period?.starts_at);
                const currentPeriodEnd = new Date(eventData.current_billing_period?.ends_at);
                const priceId = eventData.items?.[0]?.price?.id;
                const amount = parseInt(eventData.items?.[0]?.price?.unit_price?.amount || '0');
                const customData = eventData.custom_data;

                if (!customData?.userId) {
                    console.error('❌ No userId in subscription custom_data');
                    break;
                }

                const userId = customData.userId;

                // Determine plan from price ID
                const plan = priceId?.includes('yearly') ? 'YEARLY' : 'MONTHLY';

                // Create subscription record
                await PaymentService.createSubscription(
                    userId,
                    plan,
                    subscriptionId,
                    customerId,
                    currentPeriodStart,
                    currentPeriodEnd,
                    amount
                );

                console.log(`✅ Created Pro ${plan} subscription for user ${userId}`);
                break;
            }

            case 'subscription.updated': {
                // Handle subscription updates (plan changes, status changes)
                const subscriptionId = eventData.id;
                const status = eventData.status;
                const currentPeriodEnd = new Date(eventData.current_billing_period?.ends_at);

                // Update subscription record
                await prisma.subscription.updateMany({
                    where: { paddleSubscriptionId: subscriptionId },
                    data: {
                        status: status === 'active' ? 'ACTIVE' : 
                                status === 'canceled' ? 'CANCELLED' : 
                                status === 'past_due' ? 'PAST_DUE' : 'ACTIVE',
                        currentPeriodEnd,
                        cancelledAt: status === 'canceled' ? new Date() : null
                    }
                });

                // If subscription is no longer active, downgrade user
                if (status !== 'active') {
                    const subscription = await prisma.subscription.findFirst({
                        where: { paddleSubscriptionId: subscriptionId },
                        include: { user: true }
                    });

                    if (subscription) {
                        await prisma.user.update({
                            where: { id: subscription.userId },
                            data: { planType: 'FREE' }
                        });
                        console.log(`⬇️ Downgraded user ${subscription.userId} to FREE`);
                    }
                }

                console.log(`✅ Updated subscription ${subscriptionId} - status: ${status}`);
                break;
            }

            case 'subscription.canceled': {
                // Handle subscription cancellation
                const subscriptionId = eventData.id;
                const effectiveAt = new Date(eventData.scheduled_change?.effective_at || new Date());

                // Mark subscription as cancelled
                await prisma.subscription.updateMany({
                    where: { paddleSubscriptionId: subscriptionId },
                    data: {
                        status: 'CANCELLED',
                        cancelledAt: new Date()
                    }
                });

                // Find user and downgrade after grace period
                const subscription = await prisma.subscription.findFirst({
                    where: { paddleSubscriptionId: subscriptionId }
                });

                if (subscription) {
                    // If cancellation is immediate, downgrade now
                    if (effectiveAt <= new Date()) {
                        await prisma.user.update({
                            where: { id: subscription.userId },
                            data: { planType: 'FREE' }
                        });
                        console.log(`⬇️ Immediately downgraded user ${subscription.userId} to FREE`);
                    } else {
                        console.log(`📅 User ${subscription.userId} will be downgraded at ${effectiveAt}`);
                    }
                }

                console.log(`❌ Subscription ${subscriptionId} canceled`);
                break;
            }

            case 'subscription.payment_failed': {
                // Handle failed payment
                const subscriptionId = eventData.id;

                await prisma.subscription.updateMany({
                    where: { paddleSubscriptionId: subscriptionId },
                    data: {
                        status: 'PAST_DUE'
                    }
                });

                console.log(`⚠️ Payment failed for subscription ${subscriptionId}`);
                break;
            }

            case 'transaction.created':
                // Transaction created (checkout started) - no action needed
                console.log('ℹ️ Transaction created (checkout started)');
                break;

            default:
                console.log(`ℹ️ Unhandled webhook event: ${eventType}`);
        }

        // Don't log internal payment records for now - just respond success
        return NextResponse.json({ received: true, eventType });

    } catch (error) {
        console.error('❌ Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
