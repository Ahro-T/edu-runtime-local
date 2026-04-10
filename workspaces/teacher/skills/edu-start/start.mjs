#!/usr/bin/env node
/**
 * edu-start: register learner, start session, get current node.
 * Outputs complete Discord message as JSON { message: "..." }.
 */
const API = process.env.RUNTIME_API_URL || "http://app:3000";
const PILLAR = process.argv[2] || "agents";
const DISCORD_USER_ID = process.env.OPENCLAW_DISCORD_USER_ID || "unknown";

async function main() {
  try {
    // Step 1: Upsert learner
    const learnerRes = await fetch(`${API}/api/learners/upsert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordUserId: DISCORD_USER_ID }),
    });
    if (!learnerRes.ok) throw new Error("Failed to register learner");
    const learner = await learnerRes.json();

    // Step 2: Start session
    const sessionRes = await fetch(`${API}/api/sessions/start-or-resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId: learner.id, pillar: PILLAR }),
    });
    if (!sessionRes.ok) throw new Error("Failed to start session");

    // Step 3: Get current node
    const nodeRes = await fetch(
      `${API}/api/learners/${learner.id}/current-node?pillar=${PILLAR}`
    );
    if (!nodeRes.ok) throw new Error("Failed to get current node");
    const node = await nodeRes.json();

    const name = node.name || node.title || "the first topic";
    const desc = node.description || node.content || "";

    // Build complete Discord message
    const message =
      `Welcome! We are starting the **${PILLAR}** pillar.\n\n` +
      `Your first topic is **${name}**.\n` +
      (desc ? `${desc}\n\n` : "\n") +
      "Type `/edu_task` when you are ready for your first assessment.";

    console.log(JSON.stringify({ message }));
  } catch (e) {
    const message =
      `Something went wrong starting your session. ` +
      `Please try \`/edu_start ${PILLAR}\` again.`;
    console.log(JSON.stringify({ message, error: e.message }));
  }
}

main();
