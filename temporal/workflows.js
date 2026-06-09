import { proxyActivities } from '@temporalio/workflow';

// 1. Establish the proxy interceptor referencing your task architecture
const { callGeminiActivity } = proxyActivities({
    // Maximum time window allocated for a single execution pass
    startToCloseTimeout: '45 seconds', 
    
    // Fine-grained policy handling transient network crashes or 429 exceptions
    retryPolicy: {
        initialInterval: '5 seconds',   // Cool-off buffer before first retry attempt
        backoffCoefficient: 2,          // Exponential scaling: 5s, 10s, 20s, 40s...
        maximumAttempts: 5              // Definitively error out if failure persists
    }
});

/**
 * Orchestrates the secure conversational execution path.
 * @param {string} query - The captured voice transcript.
 */
export async function fridayChatWorkflow(query) {
    // Delivers resilient execution; context persists even if the server drops mid-call
    return await callGeminiActivity(query);
}