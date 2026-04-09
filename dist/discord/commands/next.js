/**
 * /next — Advance to the next node in the current pillar.
 */
import { formatAdvancement, formatError } from '../formatter.js';
const BASE_URL = `http://localhost:${process.env['PORT'] ?? 3000}`;
export async function handleNext(interaction, logger) {
    const log = logger.child({ command: 'next', userId: interaction.user.id });
    await interaction.deferReply();
    try {
        // Upsert to get learner ID
        const upsertRes = await fetch(`${BASE_URL}/api/learners/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordUserId: interaction.user.id }),
        });
        if (!upsertRes.ok) {
            await interaction.editReply(formatError('Could not identify your account.', [
                'Run `/start <pillar>` to begin a session first.',
            ]));
            return;
        }
        const { learner } = await upsertRes.json();
        if (!learner.currentPillar) {
            await interaction.editReply(formatError('You do not have an active session.', [
                'Run `/start <pillar>` to begin studying.',
            ]));
            return;
        }
        const advanceRes = await fetch(`${BASE_URL}/api/nodes/advance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ learnerId: learner.id, pillar: learner.currentPillar }),
        });
        if (!advanceRes.ok) {
            const err = await advanceRes.json();
            log.warn({ status: advanceRes.status, code: err.code }, 'Advancement failed');
            if (err.code === 'INVALID_TRANSITION') {
                await interaction.editReply(formatError('You have not yet passed the current node.', [
                    'Complete `/task` and submit your answer first.',
                    'Use `/explain` to review the material.',
                    'Use `/status` to see your current standing.',
                ]));
            }
            else {
                await interaction.editReply(formatError(err.message ?? 'Could not advance to the next node.', [
                    'Try again in a moment.',
                    'Use `/status` to check your progress.',
                ]));
            }
            return;
        }
        const result = await advanceRes.json();
        log.info({ advanced: result.advanced, pillarCompleted: result.pillarCompleted }, 'Advancement result');
        await interaction.editReply(formatAdvancement(result));
    }
    catch (err) {
        log.error({ err }, 'Unexpected error in /next');
        await interaction.editReply(formatError('An unexpected error occurred.', [
            'Try again in a moment.',
        ]));
    }
}
//# sourceMappingURL=next.js.map