import { prisma } from "@/lib/prisma";

// Import enums with fallback for before migration
const SubscriptionStatusType = (() => {
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

const SubscriptionStatus = (() => {
    try {
        const client = require("@prisma/client");
        return client.SubscriptionStatus || {
            ACTIVE: "ACTIVE",
            EXPIRED: "EXPIRED",
            CANCELLED: "CANCELLED",
            PAST_DUE: "PAST_DUE"
        };
    } catch (error) {
        return {
            ACTIVE: "ACTIVE",
            EXPIRED: "EXPIRED",
            CANCELLED: "CANCELLED",
            PAST_DUE: "PAST_DUE"
        };
    }
})();

/**
 * Payment Service - NEW PRICING MODEL
 * 
 * CORE BUSINESS RULES (NON-NEGOTIABLE):
 * 1. A user can have ONLY ONE active subscription at a time
 * 2. Subscription and pay-per-exam must NEVER overlap logically
 * 3. Monthly and yearly are the SAME plan ("Pro") with different billing intervals
 * 4. Pay-per-exam must NEVER create a subscription
 * 5. Paddle webhooks are the ONLY source of truth
 * 
 * Plans:
 * - FREE: 3 free exams (lifetime), basic anti-cheat, limited question bank
 * - PRO: $11.99/month or $99/year, unlimited exams, full features
 * - ONE-TIME: $1.99 per exam, full features for that exam only
 */

export const PaymentService = {
    /**
     * Check if user can publish an exam
     * Priority order: PRO subscription > One-time credits > Free quota
     * @returns { canPublish: boolean, reason?: string, examMode: 'FREE'|'PRO'|'ONE_TIME' }
     */
    async canPublishExam(userId: string): Promise<{
        canPublish: boolean;
        reason?: string;
        examMode?: 'FREE' | 'PRO' | 'ONE_TIME';
        freeExamsRemaining?: number;
        oneTimeExamsRemaining?: number;
    }> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                planType: true,
                freeExamsUsed: true,
                oneTimeExamsRemaining: true,
                subscriptionStatus: true,
                currentPeriodEnd: true,
            },
        });

        if (!user) {
            return { canPublish: false, reason: "User not found" };
        }

        // RULE: Check Pro subscription status using User-level fields (faster)
        // Active subscription = subscriptionStatus is ACTIVE and period hasn't ended
        const hasActiveSubscription = 
            (user.subscriptionStatus === SubscriptionStatusType.ACTIVE || user.subscriptionStatus === SubscriptionStatusType.CANCELED) &&
            user.currentPeriodEnd && 
            new Date() <= user.currentPeriodEnd;
        
        if (hasActiveSubscription) {
            return {
                canPublish: true,
                examMode: 'PRO'
            };
        }

        // RULE: Check one-time exam credits (examCredits)
        // These are INDEPENDENT from subscription - never convert to subscription
        if (user.oneTimeExamsRemaining > 0) {
            return {
                canPublish: true,
                examMode: 'ONE_TIME',
                oneTimeExamsRemaining: user.oneTimeExamsRemaining
            };
        }

        // RULE: Check free exam quota (3 lifetime exams)
        const freeExamsRemaining = Math.max(0, 3 - user.freeExamsUsed);
        if (freeExamsRemaining > 0) {
            return {
                canPublish: true,
                examMode: 'FREE',
                freeExamsRemaining
            };
        }

        // No quota available - show upgrade options
        return {
            canPublish: false,
            reason: "No exams available. Upgrade to Pro or purchase a one-time exam.",
            freeExamsRemaining: 0,
            oneTimeExamsRemaining: 0
        };
    },

    /**
     * Consume an exam quota and return the exam mode
     */
    async consumeExamQuota(userId: string): Promise<'FREE' | 'PRO' | 'ONE_TIME'> {
        const publishCheck = await this.canPublishExam(userId);
        
        if (!publishCheck.canPublish) {
            throw new Error(publishCheck.reason || "Cannot publish exam");
        }

        const examMode = publishCheck.examMode!;

        // Consume quota based on mode
        if (examMode === 'FREE') {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    freeExamsUsed: { increment: 1 }
                }
            });
        } else if (examMode === 'ONE_TIME') {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    oneTimeExamsRemaining: { decrement: 1 }
                }
            });
        }
        // Pro users don't need quota consumption

        return examMode;
    },

    /**
     * Create a Pro subscription (called after Paddle webhook)
     */
    async createSubscription(
        userId: string,
        plan: 'MONTHLY' | 'YEARLY',
        paddleSubscriptionId: string,
        paddleCustomerId: string,
        currentPeriodStart: Date,
        currentPeriodEnd: Date,
        amount: number
    ) {
        // Create subscription record
        await prisma.subscription.create({
            data: {
                userId,
                plan,
                status: SubscriptionStatus.ACTIVE,
                paddleSubscriptionId,
                paddleCustomerId,
                currentPeriodStart,
                currentPeriodEnd,
                amount,
                currency: 'USD'
            }
        });

        // Update user plan type
        await prisma.user.update({
            where: { id: userId },
            data: { planType: 'PRO' }
        });
    },

    /**
     * Cancel subscription (mark for cancellation at period end)
     */
    async cancelSubscription(userId: string, subscriptionId: string) {
        await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                cancelAtPeriodEnd: true,
                status: SubscriptionStatus.CANCELLED,
                cancelledAt: new Date()
            }
        });

        // Downgrade user to FREE (they keep access until period ends)
        await prisma.user.update({
            where: { id: userId },
            data: { planType: 'FREE' }
        });
    },

    /**
     * Grant one-time exam purchase
     */
    async grantOneTimeExam(userId: string, quantity: number = 1) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                oneTimeExamsRemaining: { increment: quantity }
            }
        });
    },

    /**
     * Check if user has active Pro subscription
     * Uses User-level fields for fast access (single source of truth sync)
     */
    async hasActiveProSubscription(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                subscriptionStatus: true,
                currentPeriodEnd: true,
            }
        });

        if (!user) return false;

        // Active if status is ACTIVE or CANCELED (grace period) and period hasn't ended
        const isActive = 
            (user.subscriptionStatus === SubscriptionStatusType.ACTIVE || user.subscriptionStatus === SubscriptionStatusType.CANCELED) &&
            user.currentPeriodEnd !== null && 
            new Date() <= user.currentPeriodEnd;

        return !!isActive;
    },

    /**
     * Get user's subscription details
     * Returns comprehensive billing status
     */
    async getSubscriptionDetails(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                freeExamsUsed: true,
                oneTimeExamsRemaining: true,
                planType: true,
                subscriptionStatus: true,
                currentPeriodEnd: true,
                paddleSubscriptionId: true,
            }
        });

        // Also get full subscription record for detailed info
        const subscription = await prisma.subscription.findFirst({
            where: { userId },
            orderBy: { currentPeriodEnd: 'desc' }
        });

        // Determine if user has active access (including grace period)
        const hasActiveAccess = user && 
            (user.subscriptionStatus === SubscriptionStatusType.ACTIVE || user.subscriptionStatus === SubscriptionStatusType.CANCELED) &&
            user.currentPeriodEnd && 
            new Date() <= user.currentPeriodEnd;

        return {
            subscription,
            user,
            freeExamsRemaining: user ? Math.max(0, 3 - user.freeExamsUsed) : 0,
            hasActiveAccess,
            subscriptionStatus: user?.subscriptionStatus || SubscriptionStatusType.NONE,
        };
    },

    /**
     * Check Question Bank limits
     */
    async canAddToQuestionBank(userId: string): Promise<{
        canAdd: boolean;
        reason?: string;
        currentCount: number;
        limit?: number;
    }> {
        const isPro = await this.hasActiveProSubscription(userId);

        if (isPro) {
            const count = await prisma.questionBank.count({
                where: { teacherId: userId }
            });
            return {
                canAdd: true,
                currentCount: count
            };
        }

        // Free users have 20 question limit
        const count = await prisma.questionBank.count({
            where: { teacherId: userId }
        });

        if (count >= 20) {
            return {
                canAdd: false,
                reason: "Free plan limited to 20 questions. Upgrade to Pro for unlimited.",
                currentCount: count,
                limit: 20
            };
        }

        return {
            canAdd: true,
            currentCount: count,
            limit: 20
        };
    }
};
