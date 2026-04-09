/**
 * /help — static help text listing all commands.
 */
const HELP_TEXT = `**Learning Bot — Available Commands**

**/start <pillar>** — Begin or resume a study session. Pillars: \`agents\`, \`harnesses\`, \`openclaw\`.
**/explain** — Get an explanation of the node you are currently studying.
**/task** — Receive the assessment prompt for the current node.
**/next** — Advance to the next node (only after passing the current one).
**/review** — Schedule a spaced-repetition review for your current node.
**/status** — See your progress dashboard across all pillars.
**/help** — Show this message.

**How to submit an answer:** Type your response freely in your study channel (e.g., \`agents-study-yourname\`). The bot will detect it and record your submission.

**Next steps:**
1. Run \`/start agents\` to begin your first session.
2. Use \`/explain\` to learn, then \`/task\` to be assessed.
3. Type your answer in the study channel and wait for feedback.`;
export async function handleHelp(interaction, logger) {
    logger.child({ command: 'help', userId: interaction.user.id }).debug('Help requested');
    await interaction.reply({ content: HELP_TEXT, ephemeral: true });
}
//# sourceMappingURL=help.js.map