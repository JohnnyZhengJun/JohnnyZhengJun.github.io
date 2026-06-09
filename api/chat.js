import { Connection, Client } from '@temporalio/client';

/**
 * Resilient Serverless Router to intercept frontend chat payloads
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Establish gRPC communication handshake with the local Temporal server
        const connection = await Connection.connect({ address: 'localhost:7233' });
        const client = new Client({ connection });

        const { query } = req.body;

        // 2. Dispatch payload into the durable background task queue
        const handle = await client.workflow.start('fridayChatWorkflow', {
            taskQueue: 'friday-task-queue',
            workflowId: `chat-session-${Date.now()}`, // Ensures unique execution tracing
            args: [query],
        });

        // 3. Collect the finalized response structure returned from the worker layer
        const result = await handle.result();
        return res.status(200).json(result);

    } catch (error) {
        console.error("Temporal Client Intercept Failure:", error);
        return res.status(500).json({ 
            reply: "Core telemetry failure. Local orchestration grid collapsed.", 
            action: "NONE" 
        });
    }
}