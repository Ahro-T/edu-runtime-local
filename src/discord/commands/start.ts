/**
 * /start <pillar> — Upsert learner, start/resume session, create study channel.
 */

import type { ChatInputCommandInteraction, Guild } from 'discord.js';
import type { Logger } from 'pino';
import { ChannelManager } from '../channel-manager.js';
import { formatError, formatNodeExplanation } from '../formatter.js';
import type { KnowledgeNode } from '../../domain/content/KnowledgeNode.js';

const BASE_URL = `http://localhost:${process.env['PORT'] ?? 3000}`;

export async function handleStart(
  interaction: ChatInputCommandInteraction,
  logger: Logger,
): Promise<void> {
  const log = logger.child({ command: 'start', userId: interaction.user.id });
  const pillar = interaction.options.getString('pillar', true) as 'agents' | 'harnesses' | 'openclaw';

  await interaction.deferReply();

  try {
    // 1. Upsert learner
    const upsertRes = await fetch(`${BASE_URL}/api/learners/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordUserId: interaction.user.id }),
    });

    if (!upsertRes.ok) {
      const err = await upsertRes.json() as { message?: string };
      await interaction.editReply(formatError(err.message ?? 'Failed to set up your account', [
        'Try again in a moment.',
        'Contact your instructor if the problem persists.',
      ]));
      return;
    }

    const { learner } = await upsertRes.json() as { learner: { id: string } };
    log.info({ learnerId: learner.id, pillar }, 'Learner upserted');

    // 2. Find or create study channel
    const guild = interaction.guild as Guild;
    const channelManager = new ChannelManager(logger);
    const channel = await channelManager.findOrCreate(guild, pillar, interaction.user.username);
    log.info({ channelId: channel.id, channelName: channel.name }, 'Study channel ready');

    // 3. Start or resume session
    const sessionRes = await fetch(`${BASE_URL}/api/sessions/start-or-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learnerId: learner.id, pillar, channelId: channel.id }),
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.json() as { message?: string };
      await interaction.editReply(formatError(err.message ?? 'Failed to start session', [
        'Try `/start` again.',
        'Make sure the content vault is set up correctly.',
      ]));
      return;
    }

    const { session } = await sessionRes.json() as { session: { id: string; currentNodeId: string | null } };
    log.info({ sessionId: session.id }, 'Session started/resumed');

    // 4. Fetch the current node for a welcome message
    let nodeMessage = '';
    if (session.currentNodeId) {
      const nodeRes = await fetch(
        `${BASE_URL}/api/learners/${learner.id}/current-node?pillar=${pillar}`,
      );
      if (nodeRes.ok) {
        const { node } = await nodeRes.json() as { node: KnowledgeNode };
        nodeMessage = '\n\n' + formatNodeExplanation(node);
      }
    }

    const intro = `**Welcome to your ${pillar} study channel!** Your session is ready in ${channel}.${nodeMessage}`;
    await interaction.editReply(intro);

    // Also post to study channel if different from current channel
    if (channel.id !== interaction.channelId) {
      await channel.send(`**${interaction.user.username}** has started a ${pillar} study session here. Use \`/explain\` or \`/task\` to continue.`);
    }
  } catch (err) {
    log.error({ err }, 'Unexpected error in /start');
    await interaction.editReply(formatError('An unexpected error occurred.', [
      'Try again in a moment.',
      'If this persists, contact your instructor.',
    ]));
  }
}
