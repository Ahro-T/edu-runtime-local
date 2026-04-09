/**
 * /explain — Fetch current node and format an explanation.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import type { Logger } from 'pino';
import { formatNodeExplanation, formatError } from '../formatter.js';
import type { KnowledgeNode } from '../../domain/content/KnowledgeNode.js';

const BASE_URL = `http://localhost:${process.env['PORT'] ?? 3000}`;

export async function handleExplain(
  interaction: ChatInputCommandInteraction,
  logger: Logger,
): Promise<void> {
  const log = logger.child({ command: 'explain', userId: interaction.user.id });
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
        'Pillars available: `agents`, `harnesses`, `openclaw`.',
      ]));
      return;
    }

    const nodeRes = await fetch(
      `${BASE_URL}/api/learners/${learner.id}/current-node?pillar=${learner.currentPillar}`,
    );

    if (!nodeRes.ok) {
      const err = await nodeRes.json() as { message?: string };
      log.warn({ status: nodeRes.status }, 'Failed to fetch current node');
      await interaction.editReply(formatError(err.message ?? 'Could not load the current node.', [
        'Run `/start <pillar>` to ensure your session is active.',
        'Try again in a moment.',
      ]));
      return;
    }

    const { node } = await nodeRes.json() as { node: KnowledgeNode };
    log.info({ nodeId: node.id }, 'Node fetched for explanation');
    await interaction.editReply(formatNodeExplanation(node));
  } catch (err) {
    log.error({ err }, 'Unexpected error in /explain');
    await interaction.editReply(formatError('An unexpected error occurred.', [
      'Try again in a moment.',
    ]));
  }
}
