/**
 * Handles free-text messages in study channels, routing them as submissions.
 */
import { ChannelManager } from './channel-manager.js';
import { formatEvaluation, formatError } from './formatter.js';
const BASE_URL = `http://localhost:${process.env['PORT'] ?? 3000}`;
export function registerMessageHandler(client, logger) {
    const log = logger.child({ service: 'message-handler' });
    const channelManager = new ChannelManager(logger);
    client.on('messageCreate', async (message) => {
        // Ignore bot messages
        if (message.author.bot)
            return;
        // Only handle messages in study channels
        const channelName = 'name' in message.channel ? message.channel.name : '';
        if (!channelManager.isStudyChannel(channelName))
            return;
        const pillar = channelManager.pillarFromChannelName(channelName);
        if (!pillar)
            return;
        // Ignore command-like messages (start with /)
        if (message.content.trim().startsWith('/'))
            return;
        // Require minimum length to avoid accidental captures
        if (message.content.trim().length < 10)
            return;
        const log2 = log.child({ userId: message.author.id, channelName, pillar });
        log2.info('Free-text submission detected');
        try {
            // 1. Upsert learner
            const upsertRes = await fetch(`${BASE_URL}/api/learners/upsert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discordUserId: message.author.id }),
            });
            if (!upsertRes.ok) {
                log2.warn('Failed to upsert learner for submission');
                return;
            }
            const { learner } = await upsertRes.json();
            // 2. Get active session
            const sessionRes = await fetch(`${BASE_URL}/api/sessions/start-or-resume`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ learnerId: learner.id, pillar, channelId: message.channelId }),
            });
            if (!sessionRes.ok) {
                log2.warn('No active session for submission');
                await message.reply(formatError('No active session found for this channel.', [
                    'Run `/start ' + pillar + '` to start or resume your session.',
                ]));
                return;
            }
            const { session } = await sessionRes.json();
            if (!session.currentNodeId) {
                log2.warn('Session has no current node');
                return;
            }
            // 3. Record submission
            const submissionRes = await fetch(`${BASE_URL}/api/submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    learnerId: learner.id,
                    sessionId: session.id,
                    nodeId: session.currentNodeId,
                    rawAnswer: message.content.trim(),
                }),
            });
            if (!submissionRes.ok) {
                const err = await submissionRes.json();
                log2.warn({ code: err.code }, 'Failed to record submission');
                if (err.code === 'SUBMISSION_DUPLICATE') {
                    await message.reply(formatError('This submission appears to be a duplicate.', [
                        'Wait for your current submission to be evaluated.',
                        'Use `/status` to check your current standing.',
                    ]));
                }
                else {
                    await message.reply(formatError(err.message ?? 'Could not record your submission.', [
                        'Try again in a moment.',
                    ]));
                }
                return;
            }
            const { submission } = await submissionRes.json();
            log2.info({ submissionId: submission.id }, 'Submission recorded, triggering evaluation');
            // Acknowledge receipt
            const ackMsg = await message.reply('Your answer has been received. Evaluating...');
            // 4. Trigger evaluation
            const evalRes = await fetch(`${BASE_URL}/api/submissions/${submission.id}/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!evalRes.ok) {
                const err = await evalRes.json();
                log2.warn({ code: err.code }, 'Evaluation failed');
                if (err.code === 'EVALUATION_UNAVAILABLE') {
                    await ackMsg.edit(formatError('Evaluation is temporarily unavailable.', [
                        'Your answer has been saved and will be evaluated when the service recovers.',
                        'Use `/status` to check if evaluation has completed.',
                        'Contact your instructor if this persists.',
                    ]));
                }
                else {
                    await ackMsg.edit(formatError(err.message ?? 'Evaluation failed.', [
                        'Your submission was saved.',
                        'Try again in a moment.',
                    ]));
                }
                return;
            }
            const { evaluation } = await evalRes.json();
            log2.info({ result: evaluation.result, score: evaluation.score }, 'Evaluation complete');
            // Get node title for better formatting
            const nodeRes = await fetch(`${BASE_URL}/api/learners/${learner.id}/current-node?pillar=${pillar}`);
            const nodeTitle = nodeRes.ok
                ? ((await nodeRes.json()).node.title)
                : session.currentNodeId;
            await ackMsg.edit(formatEvaluation(evaluation, nodeTitle));
        }
        catch (err) {
            log2.error({ err }, 'Unexpected error processing message submission');
        }
    });
}
//# sourceMappingURL=message-handler.js.map