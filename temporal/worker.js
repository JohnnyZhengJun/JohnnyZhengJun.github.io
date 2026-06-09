import { Worker } from '@temporalio/worker';
import * as activities from './activities.js';

async function runWorker() {
    // 1. Configure the Worker engine
    const worker = await Worker.create({
        // Point to the deterministic workflow file
        workflowsPath: new URL('./workflows.js', import.meta.url).pathname,
        
        // Load the actual functions that talk to Gemini
        activities,
        
        // This MUST match the queue name we will send from Vercel later
        taskQueue: 'friday-task-queue',
    });

    console.log('F.R.I.D.A.Y. Background Worker is online. Listening for incoming commands...');

    // 2. Start the continuous polling loop
    await worker.run();
}

runWorker().catch((err) => {
    console.error('Worker failed to initialize:', err);
    process.exit(1);
});