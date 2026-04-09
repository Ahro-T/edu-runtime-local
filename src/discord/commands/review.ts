/**
 * /review — Schedule a spaced-repetition review for the current node.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import type { Logger } from 'pino';
import { formatReviewScheduled, formatError } from '../formatter.js';

const BASE_URL = `http://localhost:${process.env['PORT'] ?? 3000}`;

export async function handleReview(
  interaction: ChatInputCommandInteraction,
  logger: Logger,
): Promise<void> {
  const log = logger.child({ command: 'review', userId: interaction.user.id });
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

    const { learner } = await upsertRes.json() as { learner: { id: string; currentPillar: string | null } };

    if (!learner.currentPillar) {
      await interaction.editReply(formatError('You do not have an active session.', [
        'Run `/start <pillar>` to begin studying.',
      ]));
      return;
    }

    // Get current node ID
    const nodeRes = await fetch(
      `${BASE_URL}/api/learners/${learner.id}/current-node?pillar=${learner.currentPillar}`,
    );

    if (!nodeRes.ok) {
      const err = await nodeRes.json() as { message?: string };
      await interaction.editReply(formatError(err.message ?? 'Could not determine the current node.', [
        'Ensure your session is active with `/start <pillar>`.',
      ]));
      return;
    }

    const { node } = await nodeRes.json() as { node: { id: string } };

    // Schedule review (defaults to tomorrow)
    const reviewRes = await fetch(`${BASE_URL}/api/reviews/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learnerId: learner.id, nodeId: node.id }),
    });

    if (!reviewRes.ok) {
      const err = await reviewRes.json() as { message?: string; code?: string };
      log.warn({ status: reviewRes.status, code: err.code }, 'Review scheduling failed');

      if (err.code === 'REVIEW_JOB_CONFLICT') {
        await interaction.editReply(formatError('A review is already scheduled for this node.', [
          'Use `/status` to see your pending reviews.',
          'The existing review will run on its scheduled date.',
        ]));
      } else {
        await interaction.editReply(formatError(err.message ?? 'Could not schedule review.', [
          'Try again in a moment.',
        ]));
      }
      return;
    }

    const { job } = await reviewRes.json() as { job: { nodeId: string; scheduledFor: string } };
    log.info({ nodeId: job.nodeId }, 'Review scheduled');
    await interaction.editReply(formatReviewScheduled(job.nodeId, new Date(job.scheduledFor)));
  } catch (err) {
    log.error({ err }, 'Unexpected error in /review');
    await interaction.editReply(formatError('An unexpected error occurred.', [
      'Try again in a moment.',
    ]));
  }
}
