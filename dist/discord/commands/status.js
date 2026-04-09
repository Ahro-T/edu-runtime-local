/**
 * /status — Show the learner's dashboard.
 */
import { formatDashboard, formatError } from '../formatter.js';
const BASE_URL = `http://localhost:${process.env['PORT'] ?? 3000}`;
export async function handleStatus(interaction, logger) {
    const log = logger.child({ command: 'status', userId: interaction.user.id });
    await interaction.deferReply();
    try {
        // First upsert the learner to get their ID
        const upsertRes = await fetch(`${BASE_URL}/api/learners/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordUserId: interaction.user.id }),
        });
        if (!upsertRes.ok) {
            const err = await upsertRes.json();
            await interaction.editReply(formatError(err.message ?? 'Failed to identify your account', [
                'Try again in a moment.',
                'Run `/start <pillar>` to ensure your account exists.',
            ]));
            return;
        }
        const { learner } = await upsertRes.json();
        const dashRes = await fetch(`${BASE_URL}/api/learners/${learner.id}/dashboard`);
        if (!dashRes.ok) {
            const err = await dashRes.json();
            log.warn({ status: dashRes.status }, 'Dashboard fetch failed');
            await interaction.editReply(formatError(err.message ?? 'Could not load dashboard', [
                'Try again in a moment.',
                'Run `/start <pillar>` if you have not started yet.',
            ]));
            return;
        }
        const { dashboard } = await dashRes.json();
        log.info('Dashboard fetched');
        await interaction.editReply(formatDashboard(dashboard));
    }
    catch (err) {
        log.error({ err }, 'Unexpected error in /status');
        await interaction.editReply(formatError('An unexpected error occurred.', [
            'Try again in a moment.',
            'If this persists, contact your instructor.',
        ]));
    }
}
//# sourceMappingURL=status.js.map