#!/usr/bin/env node
/**
 * edu-explain: fetch current node and build a complete explanation message.
 * Outputs JSON { message: "..." }.
 */
const API = process.env.RUNTIME_API_URL || "http://app:3000";
const PILLAR = process.argv[2] || "agents";
const DISCORD_USER_ID = process.env.OPENCLAW_DISCORD_USER_ID || "unknown";

async function main() {
  try {
    const learnerRes = await fetch(`${API}/api/learners/upsert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordUserId: DISCORD_USER_ID }),
    });
    if (!learnerRes.ok) throw new Error("Failed to find learner");
    const learner = await learnerRes.json();

    const nodeRes = await fetch(
      `${API}/api/learners/${learner.id}/current-node?pillar=${PILLAR}`
    );
    if (!nodeRes.ok) throw new Error("Failed to get current node");
    const node = await nodeRes.json();

    const name = node.name || node.title || "this concept";
    const desc = node.description || node.content || "";
    const prereqs = node.prerequisites || node.prereqs || "";

    let message = `**${name}**\n\n`;
    if (desc) message += `${desc}\n\n`;
    if (prereqs) message += `Related to: ${prereqs}\n\n`;
    message += "Type `/edu_task` when you are ready for assessment.";

    console.log(JSON.stringify({ message }));
  } catch (e) {
    const message = "Could not load the current topic. Try `/edu_explain` again.";
    console.log(JSON.stringify({ message, error: e.message }));
  }
}

main();
