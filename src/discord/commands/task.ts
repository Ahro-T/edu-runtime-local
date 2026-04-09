/**
 * /task — Fetch the assessment template for the current node and issue the prompt.
 */

import type { ChatInputCommandInteraction } from 'discord.js';
import type { Logger } from 'pino';
import { formatTaskPrompt, formatError } from '../formatter.js';
import type { KnowledgeNode } from '../../domain/content/KnowledgeNode.js';

const BASE_URL = `http://localhost:${process.env['PORT'] ?? 3000}`;

interface AssessmentTemplate {
  id: string;
  nodeId: string;
  instructions: string;
  requiredSlots: string[];
}

export async function handleTask(
  interaction: ChatInputCommandInteraction,
  logger: Logger,
): Promise<void> {
  const log = logger.child({ command: 'task', userId: interaction.user.id });
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

    // Get current node
    const nodeRes = await fetch(
      `${BASE_URL}/api/learners/${learner.id}/current-node?pillar=${learner.currentPillar}`,
    );

    if (!nodeRes.ok) {
      const err = await nodeRes.json() as { message?: string };
      await interaction.editReply(formatError(err.message ?? 'Could not load the current node.', [
        'Run `/start <pillar>` to ensure your session is active.',
      ]));
      return;
    }

    const { node } = await nodeRes.json() as { node: KnowledgeNode & { assessmentTemplateId: string } };

    // Fetch assessment template — the API exposes it via the node's assessmentTemplateId
    // We use the node data itself as the instructions source since template fetch is not a direct endpoint
    // The instructions come from the node summary + body as the assessment prompt
    const instructions = node.body
      ? `${node.summary}\n\nIn your answer, describe: what it is, why it matters, how it relates to adjacent concepts, provide an example, and identify its boundaries/limitations.`
      : `${node.summary}\n\nDescribe: what it is, why it matters, an example, and its limitations.`;

    log.info({ nodeId: node.id }, 'Task prompt issued');
    await interaction.editReply(formatTaskPrompt(node, instructions));
  } catch (err) {
    log.error({ err }, 'Unexpected error in /task');
    await interaction.editReply(formatError('An unexpected error occurred.', [
      'Try again in a moment.',
    ]));
  }
}
