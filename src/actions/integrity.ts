"use server";

import { IntegrityTracker, IntegrityEventType, IntegrityEventMetadata } from "@/lib/integrity-tracker";
import { verifySession } from "@/lib/session";

/**
 * Record an integrity event during exam
 * This is called from the client during exam session
 */
export async function recordIntegrityEventAction(
    attemptId: string,
    eventType: IntegrityEventType,
    metadata?: IntegrityEventMetadata
) {
    try {
        await IntegrityTracker.trackEvent(attemptId, eventType, metadata);
        return { success: true };
    } catch (e) {
        console.error("Record integrity event error", e);
        return { success: false, error: "Failed to record event" };
    }
}

/**
 * Get integrity report for a specific attempt (Teacher only)
 */
export async function getIntegrityReportAction(attemptId: string) {
    try {
        const session = await verifySession();
        if (!session) {
            return { success: false, error: "Unauthorized" };
        }

        const report = await IntegrityTracker.generateIntegrityReport(attemptId);
        
        return {
            success: true,
            report
        };
    } catch (e) {
        console.error("Get integrity report error", e);
        return { success: false, error: "Failed to generate report" };
    }
}

/**
 * Calculate integrity scores for all attempts in an exam (Teacher only)
 */
export async function calculateExamIntegrityAction(examId: string) {
    try {
        const session = await verifySession();
        if (!session) {
            return { success: false, error: "Unauthorized" };
        }

        const results = await IntegrityTracker.calculateExamIntegrity(examId);
        
        return {
            success: true,
            results
        };
    } catch (e) {
        console.error("Calculate exam integrity error", e);
        return { success: false, error: "Failed to calculate integrity" };
    }
}
