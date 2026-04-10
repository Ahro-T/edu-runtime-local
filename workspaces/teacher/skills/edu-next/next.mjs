#!/usr/bin/env node
/**
 * edu-next: advance to next node and build a message about the new topic.
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

    const advanceRes = await fetch(`${API}/api/nodes/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId: learner.id, pillar: PILLAR }),
    });
    if (!advanceRes.ok) {
      const message =
        "Could not advance. You may need to pass the current task first. " +
        "Try `/edu_task` to attempt the assessment.";
      console.log(JSON.stringify({ message }));
      return;
    }

    const nodeRes = await fetch(
      `${API}/api/learners/${learner.id}/current-node?pillar=${PILLAR}`
    );
    if (!nodeRes.ok) throw new Error("Failed to get new node");
    const node = await nodeRes.json();

    const name = node.name || node.title || "the next topic";
    const desc = node.description || node.content || "";

    let message = `Great progress! You have moved to the next topic.\n\n`;
    message += `Your new topic is **${name}**.\n`;
    if (desc) message += `${desc}\n\n`;
    else message += "\n";
    message += "Type `/edu_task` when you are ready for assessment.";

    console.log(JSON.stringify({ message }));
  } catch (e) {
    const message = "Something went wrong advancing. Try `/edu_next` again.";
    console.log(JSON.stringify({ message, error: e.message }));
  }
}

main();
