/**
 * Formats API responses into Discord-friendly messages.
 * Teacher tone: concise but instructional, constructive on failure, always 1-3 next steps.
 */
/**
 * Format a knowledge node as an explanation message (3–8 sentences).
 */
export function formatNodeExplanation(node) {
    const lines = [];
    lines.push(`**${node.title}**`);
    lines.push('');
    lines.push(node.summary);
    if (node.body) {
        // Truncate body to keep within 3–8 sentence budget
        const sentences = node.body.split(/(?<=[.!?])\s+/).slice(0, 6).join(' ');
        lines.push(sentences);
    }
    lines.push('');
    lines.push('**Next steps:**');
    lines.push('1. Use `/task` to get your assessment prompt.');
    lines.push('2. Type your answer directly in this channel.');
    lines.push('3. Use `/explain` again if you need a refresher before answering.');
    return lines.join('\n');
}
/**
 * Format an assessment template as a task prompt.
 */
export function formatTaskPrompt(node, instructions) {
    const lines = [];
    lines.push(`**Assessment: ${node.title}**`);
    lines.push('');
    lines.push(instructions);
    lines.push('');
    lines.push('**Next steps:**');
    lines.push('1. Type your answer in this channel (free text — be thorough).');
    lines.push('2. Use `/explain` if you want to review the concept first.');
    lines.push('3. Take your time — quality matters more than speed.');
    return lines.join('\n');
}
/**
 * Format an evaluation result with pass/fail/remediation tone.
 */
export function formatEvaluation(result, nodeTitle) {
    const lines = [];
    if (result.result === 'pass') {
        lines.push(`**Passed: ${nodeTitle}** (score: ${Math.round(result.score * 100)}%)`);
        lines.push('');
        lines.push(result.feedback);
        lines.push('');
        lines.push('**Next steps:**');
        lines.push('1. Use `/next` to advance to the next topic.');
        lines.push('2. Use `/status` to review your overall progress.');
        lines.push('3. Use `/review` to schedule a spaced-repetition review later.');
    }
    else if (result.result === 'fail') {
        lines.push(`**Not quite there yet: ${nodeTitle}** (score: ${Math.round(result.score * 100)}%)`);
        lines.push('');
        lines.push(result.feedback);
        if (result.missingPoints.length > 0) {
            lines.push('');
            lines.push('**Areas to strengthen:**');
            result.missingPoints.forEach((p) => lines.push(`• ${p}`));
        }
        lines.push('');
        lines.push('**Next steps:**');
        lines.push('1. Use `/explain` to revisit the concept with fresh eyes.');
        lines.push('2. Resubmit your answer — focus on the missing points above.');
        lines.push('3. Use `/task` to see the prompt again.');
    }
    else {
        // remediation
        lines.push(`**Let's work through this together: ${nodeTitle}**`);
        lines.push('');
        lines.push(result.feedback);
        if (result.missingPoints.length > 0) {
            lines.push('');
            lines.push('**Focus on these concepts:**');
            result.missingPoints.forEach((p) => lines.push(`• ${p}`));
        }
        lines.push('');
        lines.push('**Next steps:**');
        lines.push('1. Use `/explain` for a guided walkthrough of this topic.');
        lines.push('2. Try a simpler explanation in your own words first.');
        lines.push('3. Ask questions in the channel — the process matters.');
    }
    return lines.join('\n');
}
/**
 * Format a dashboard as a status summary.
 */
export function formatDashboard(data) {
    const lines = [];
    lines.push('**Your Learning Dashboard**');
    lines.push('');
    lines.push(`Nodes passed: **${data.passedNodes}** | Total submissions: **${data.totalSubmissions}**`);
    if (data.activeSessions.length > 0) {
        lines.push('');
        lines.push('**Active sessions:**');
        for (const session of data.activeSessions) {
            lines.push(`• ${session.pillar} — node: \`${session.currentNodeId ?? 'none'}\` (${session.status})`);
        }
    }
    if (data.nodeStates.length > 0) {
        lines.push('');
        lines.push('**Node progress:**');
        for (const ns of data.nodeStates) {
            const statusEmoji = ns.status === 'passed' || ns.status === 'mastered' ? '✓' : ns.status === 'studying' ? '→' : '○';
            lines.push(`${statusEmoji} \`${ns.nodeId}\` — ${ns.status} (attempts: ${ns.attemptCount})`);
        }
    }
    if (data.pendingReviews.length > 0) {
        lines.push('');
        lines.push('**Pending reviews:**');
        for (const job of data.pendingReviews) {
            const due = job.scheduledFor.toLocaleDateString();
            lines.push(`• \`${job.nodeId}\` — due ${due}`);
        }
    }
    lines.push('');
    lines.push('**Next steps:**');
    if (data.activeSessions.length === 0) {
        lines.push('1. Use `/start <pillar>` to begin a new learning path.');
    }
    else {
        lines.push('1. Use `/explain` to review your current node.');
        lines.push('2. Use `/task` to get your assessment.');
        lines.push('3. Use `/next` to advance when ready.');
    }
    return lines.join('\n');
}
/**
 * Format an advancement result.
 */
export function formatAdvancement(result) {
    if (result.pillarCompleted) {
        return [
            '**Pillar complete!** You have mastered all nodes in this learning path.',
            '',
            '**Next steps:**',
            '1. Use `/status` to see your overall progress.',
            '2. Use `/start <pillar>` to begin another pillar.',
            '3. Use `/review` to schedule spaced-repetition reviews.',
        ].join('\n');
    }
    if (result.advanced && result.nextNode) {
        return [
            `**Advanced to: ${result.nextNode.title}**`,
            '',
            result.nextNode.summary,
            '',
            '**Next steps:**',
            '1. Use `/explain` to get a full explanation of this node.',
            '2. Use `/task` when you\'re ready to be assessed.',
            '3. Use `/status` to track your overall progress.',
        ].join('\n');
    }
    return [
        'You are not yet ready to advance. Make sure you have passed the current node.',
        '',
        '**Next steps:**',
        '1. Use `/task` to attempt the assessment.',
        '2. Use `/explain` to review the current concept.',
        '3. Use `/status` to see your current position.',
    ].join('\n');
}
/**
 * Format a review scheduling confirmation.
 */
export function formatReviewScheduled(nodeId, scheduledFor) {
    return [
        `**Review scheduled for \`${nodeId}\`**`,
        `You will be reminded on ${scheduledFor.toLocaleDateString()}.`,
        '',
        '**Next steps:**',
        '1. Continue with `/explain` or `/task` to keep progressing.',
        '2. Use `/status` to see all your pending reviews.',
        '3. When the review date arrives, revisit with `/explain`.',
    ].join('\n');
}
/**
 * Format an error message constructively.
 */
export function formatError(message, suggestions) {
    const lines = [`**Something went wrong:** ${message}`, ''];
    if (suggestions.length > 0) {
        lines.push('**Try:**');
        suggestions.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    }
    return lines.join('\n');
}
//# sourceMappingURL=formatter.js.map