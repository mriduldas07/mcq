import { prisma } from "@/lib/prisma";

/**
 * Payment Service - NEW PRICING MODEL
 * 
 * Plans:
 * - FREE: 3 free exams (lifetime), limited features
 * - PRO: $11.99/month or $99/year, unlimited exams, full features
 * - ONE-TIME: $1.99 per exam, full features for that exam only
 */

export const PaymentService = {
    /**
     * Check if user can publish an exam
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
                subscriptions: {
                    where: {
                        status: 'ACTIVE',
                    },
                    orderBy: {
                        currentPeriodEnd: 'desc'
                    },
                    take: 1
                }
            },
        });

        if (!user) {
            return { canPublish: false, reason: "User not found" };
        }

        // Check Pro subscription status
        const hasActiveSubscription = user.subscriptions.length > 0;
        
        if (hasActiveSubscription) {
            const subscription = user.subscriptions[0];
            // Verify subscription hasn't expired
            if (new Date() <= subscription.currentPeriodEnd) {
                return {
                    canPublish: true,
                    examMode: 'PRO'
                };
            }
        }

        // Check one-time exam purchases
        if (user.oneTimeExamsRemaining > 0) {
            return {
                canPublish: true,
                examMode: 'ONE_TIME',
                oneTimeExamsRemaining: user.oneTimeExamsRemaining
            };
        }

        // Check free exam quota
        const freeExamsRemaining = Math.max(0, 3 - user.freeExamsUsed);
        if (freeExamsRemaining > 0) {
            return {
                canPublish: true,
                examMode: 'FREE',
                freeExamsRemaining
            };
        }

        // No quota available
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
                status: 'ACTIVE',
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
                status: 'CANCELLED',
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
     */
    async hasActiveProSubscription(userId: string): Promise<boolean> {
        const subscription = await prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
                currentPeriodEnd: {
                    gte: new Date()
                }
            }
        });

        return !!subscription;
    },

    /**
     * Get user's subscription details
     */
    async getSubscriptionDetails(userId: string) {
        const subscription = await prisma.subscription.findFirst({
            where: { userId },
            orderBy: { currentPeriodEnd: 'desc' }
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                freeExamsUsed: true,
                oneTimeExamsRemaining: true,
                planType: true
            }
        });

        return {
            subscription,
            user,
            freeExamsRemaining: user ? Math.max(0, 3 - user.freeExamsUsed) : 0
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
