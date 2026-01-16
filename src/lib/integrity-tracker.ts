import { prisma } from "@/lib/prisma";

/**
 * Integrity Tracking System
 * 
 * This implements a 4-layer exam integrity system:
 * LAYER 1: Prevention (fullscreen, timer control)
 * LAYER 2: Detection (track events without blocking)
 * LAYER 3: Measurement (calculate trust/integrity scores)
 * LAYER 4: Evidence (generate reports for teachers)
 * 
 * Philosophy: Collect evidence, don't punish automatically
 */

export type IntegrityEventType = 
    | 'TAB_SWITCH'
    | 'FULLSCREEN_EXIT'
    | 'FOCUS_LOST'
    | 'FOCUS_GAINED'
    | 'COPY_ATTEMPT'
    | 'PASTE_ATTEMPT'
    | 'RIGHT_CLICK'
    | 'CONSOLE_OPENED';

export interface IntegrityEventMetadata {
    questionId?: string;
    duration?: number; // For focus lost events
    previousScore?: number; // For tracking score changes
    [key: string]: any;
}

export const IntegrityTracker = {
    /**
     * Record an integrity event
     */
    async trackEvent(
        attemptId: string,
        eventType: IntegrityEventType,
        metadata?: IntegrityEventMetadata
    ) {
        await prisma.integrityEvent.create({
            data: {
                attemptId,
                eventType,
                metadata: metadata || {},
                timestamp: new Date()
            }
        });
    },

    /**
     * Calculate integrity score based on events
     * 
     * Scoring weights:
     * - Focus time: 40% (time spent in focus vs away)
     * - Fullscreen compliance: 30% (exits and duration outside)
     * - Answer patterns: 20% (suspicious revisions, timing)
     * - Other violations: 10% (copy, paste, right-click)
     */
    async calculateIntegrityScore(attemptId: string): Promise<{
        score: number;
        level: 'HIGH' | 'MEDIUM' | 'LOW';
        breakdown: {
            focusScore: number;
            fullscreenScore: number;
            answerPatternScore: number;
            violationScore: number;
        };
    }> {
        const attempt = await prisma.studentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                exam: {
                    select: {
                        duration: true
                    }
                },
                integrityEvents: true
            }
        });

        if (!attempt) {
            throw new Error("Attempt not found");
        }

        const events = attempt.integrityEvents;
        const totalExamDuration = attempt.exam.duration * 60; // Convert to seconds

        // 1. Focus Score (40% weight)
        const focusLostEvents = events.filter(e => e.eventType === 'FOCUS_LOST');
        const tabSwitchEvents = events.filter(e => e.eventType === 'TAB_SWITCH');
        const totalFocusViolations = focusLostEvents.length + tabSwitchEvents.length;
        
        // Calculate total away time
        let totalAwayTime = 0;
        const focusLostTimestamps: Date[] = [];
        const focusGainedTimestamps: Date[] = [];
        
        events.forEach(e => {   
            if (e.eventType === 'FOCUS_LOST') focusLostTimestamps.push(e.timestamp);
            if (e.eventType === 'FOCUS_GAINED') focusGainedTimestamps.push(e.timestamp);
        });

        // Calculate away duration
        for (let i = 0; i < focusLostTimestamps.length; i++) {
            const lostTime = focusLostTimestamps[i];
            const gainedTime = focusGainedTimestamps[i] || new Date();
            const duration = (gainedTime.getTime() - lostTime.getTime()) / 1000;
            totalAwayTime += duration;
        }

        const focusPercentage = Math.max(0, 100 - (totalAwayTime / totalExamDuration * 100));
        const focusScore = Math.max(0, 100 - (totalFocusViolations * 10)); // Deduct 10 per violation

        // 2. Fullscreen Score (30% weight)
        const fullscreenExits = events.filter(e => e.eventType === 'FULLSCREEN_EXIT').length;
        const fullscreenScore = Math.max(0, 100 - (fullscreenExits * 15)); // Deduct 15 per exit

        // 3. Answer Pattern Score (20% weight)
        const answerRevisions = attempt.answerRevisions as Record<string, number> || {};
        const totalRevisions = Object.values(answerRevisions).reduce((sum, count) => sum + count, 0);
        const avgRevisionsPerQuestion = totalRevisions / (attempt.totalQuestions || 1);
        
        // More than 3 revisions per question is suspicious
        const revisionPenalty = Math.min(50, avgRevisionsPerQuestion * 10);
        const answerPatternScore = Math.max(0, 100 - revisionPenalty);

        // 4. Violation Score (10% weight)
        const copyAttempts = events.filter(e => e.eventType === 'COPY_ATTEMPT').length;
        const pasteAttempts = events.filter(e => e.eventType === 'PASTE_ATTEMPT').length;
        const rightClicks = events.filter(e => e.eventType === 'RIGHT_CLICK').length;
        const totalViolations = copyAttempts + pasteAttempts + rightClicks;
        const violationScore = Math.max(0, 100 - (totalViolations * 20));

        // Calculate weighted final score
        const finalScore = Math.round(
            focusScore * 0.4 +
            fullscreenScore * 0.3 +
            answerPatternScore * 0.2 +
            violationScore * 0.1
        );

        // Determine level
        let level: 'HIGH' | 'MEDIUM' | 'LOW';
        if (finalScore >= 80) level = 'HIGH';
        else if (finalScore >= 50) level = 'MEDIUM';
        else level = 'LOW';

        // Update attempt with scores
        await prisma.studentAttempt.update({
            where: { id: attemptId },
            data: {
                trustScore: finalScore,
                integrityLevel: level,
                totalAwayTime: Math.round(totalAwayTime)
            }
        });

        return {
            score: finalScore,
            level,
            breakdown: {
                focusScore: Math.round(focusScore),
                fullscreenScore: Math.round(fullscreenScore),
                answerPatternScore: Math.round(answerPatternScore),
                violationScore: Math.round(violationScore)
            }
        };
    },

    /**
     * Generate integrity report with timeline and evidence
     */
    async generateIntegrityReport(attemptId: string): Promise<{
        score: number;
        level: 'HIGH' | 'MEDIUM' | 'LOW';
        totalEvents: number;
        timeline: Array<{
            timestamp: Date;
            eventType: string;
            description: string;
            severity: 'low' | 'medium' | 'high';
            questionId?: string;
        }>;
        summary: {
            totalAwayTime: number;
            focusLostCount: number;
            fullscreenExitCount: number;
            suspiciousActions: number;
        };
        recommendations: string[];
    }> {
        const attempt = await prisma.studentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                integrityEvents: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });

        if (!attempt) {
            throw new Error("Attempt not found");
        }

        // Calculate latest scores
        const scoreData = await this.calculateIntegrityScore(attemptId);

        // Build timeline
        const timeline = attempt.integrityEvents.map(event => {
            let description = '';
            let severity: 'low' | 'medium' | 'high' = 'low';

            switch (event.eventType) {
                case 'TAB_SWITCH':
                    description = 'Student switched to another tab or application';
                    severity = 'high';
                    break;
                case 'FULLSCREEN_EXIT':
                    description = 'Student exited fullscreen mode';
                    severity = 'high';
                    break;
                case 'FOCUS_LOST':
                    description = 'Browser window lost focus';
                    severity = 'medium';
                    break;
                case 'FOCUS_GAINED':
                    description = 'Browser window regained focus';
                    severity = 'low';
                    break;
                case 'COPY_ATTEMPT':
                    description = 'Student attempted to copy text';
                    severity = 'medium';
                    break;
                case 'PASTE_ATTEMPT':
                    description = 'Student attempted to paste text';
                    severity = 'medium';
                    break;
                case 'RIGHT_CLICK':
                    description = 'Student right-clicked (context menu)';
                    severity = 'low';
                    break;
                case 'CONSOLE_OPENED':
                    description = 'Developer console was opened';
                    severity = 'high';
                    break;
                default:
                    description = 'Unknown event';
            }

            return {
                timestamp: event.timestamp,
                eventType: event.eventType,
                description,
                severity,
                questionId: (event.metadata as any)?.questionId
            };
        });

        // Calculate summary
        const focusLostCount = attempt.integrityEvents.filter(
            e => e.eventType === 'FOCUS_LOST' || e.eventType === 'TAB_SWITCH'
        ).length;

        const fullscreenExitCount = attempt.integrityEvents.filter(
            e => e.eventType === 'FULLSCREEN_EXIT'
        ).length;

        const suspiciousActions = attempt.integrityEvents.filter(
            e => ['COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CONSOLE_OPENED'].includes(e.eventType)
        ).length;

        // Generate recommendations
        const recommendations: string[] = [];
        
        if (scoreData.level === 'LOW') {
            recommendations.push('Consider manual review of this submission');
            recommendations.push('Multiple integrity violations detected');
        }

        if (focusLostCount > 5) {
            recommendations.push(`Student lost focus ${focusLostCount} times - possible external assistance`);
        }

        if (fullscreenExitCount > 3) {
            recommendations.push(`Student exited fullscreen ${fullscreenExitCount} times - review answers`);
        }

        if (suspiciousActions > 0) {
            recommendations.push(`${suspiciousActions} copy/paste attempts detected`);
        }

        if (attempt.totalAwayTime > 60) {
            recommendations.push(`Student was away for ${Math.round(attempt.totalAwayTime / 60)} minutes`);
        }

        if (recommendations.length === 0) {
            recommendations.push('No major concerns detected');
            recommendations.push('Exam completed with high integrity');
        }

        return {
            score: scoreData.score,
            level: scoreData.level,
            totalEvents: attempt.integrityEvents.length,
            timeline,
            summary: {
                totalAwayTime: attempt.totalAwayTime,
                focusLostCount,
                fullscreenExitCount,
                suspiciousActions
            },
            recommendations
        };
    },

    /**
     * Batch calculate integrity for all attempts in an exam
     */
    async calculateExamIntegrity(examId: string) {
        const attempts = await prisma.studentAttempt.findMany({
            where: {
                examId,
                submitted: true
            },
            select: { id: true }
        });

        const results = [];
        for (const attempt of attempts) {
            const score = await this.calculateIntegrityScore(attempt.id);
            results.push({
                attemptId: attempt.id,
                ...score
            });
        }

        return results;
    }
};
