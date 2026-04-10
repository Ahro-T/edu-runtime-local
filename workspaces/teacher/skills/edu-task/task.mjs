#!/usr/bin/env node
/**
 * edu-task: fetch current node and build a 5-slot assessment task.
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

    const message =
      `Answer these 5 questions about **${name}**. Write 2-3 sentences each.\n\n` +
      `**1. Definition** — What is ${name}? Give a clear definition.\n` +
      `**2. Importance** — Why does ${name} matter? What happens without it?\n` +
      `**3. Relation** — How does ${name} connect to other concepts you learned?\n` +
      `**4. Example** — Give one specific, real example of ${name}.\n` +
      `**5. Boundary** — What is ${name} NOT? Name a common confusion.\n\n` +
      "Type your answer below when ready.";

    console.log(JSON.stringify({ message }));
  } catch (e) {
    const message = "Could not load the assessment task. Try `/edu_task` again.";
    console.log(JSON.stringify({ message, error: e.message }));
  }
}

main();
