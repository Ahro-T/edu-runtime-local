#!/usr/bin/env node
/**
 * edu-status: fetch learner dashboard and build a status message.
 * Outputs JSON { message: "..." }.
 */
const API = process.env.RUNTIME_API_URL || "http://app:3000";
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

    const dashRes = await fetch(`${API}/api/learners/${learner.id}/dashboard`);
    if (!dashRes.ok) throw new Error("Failed to get dashboard");
    const db = await dashRes.json();

    let lines = ["Here is your progress:\n"];

    if (db.currentNode) {
      lines.push(`**Current topic**: ${db.currentNode.name || db.currentNode.title || "unknown"}`);
    }
    if (db.session) {
      lines.push(`**Pillar**: ${db.session.pillar || "unknown"}`);
    }
    if (db.progress) {
      for (const [pillar, prog] of Object.entries(db.progress)) {
        if (typeof prog === "object") {
          lines.push(`**${pillar}**: ${prog.completed || 0}/${prog.total || "?"} nodes done`);
        } else {
          lines.push(`**${pillar}**: ${prog}`);
        }
      }
    }

    const reviews = db.pendingReviews?.length || 0;
    lines.push(`**Pending reviews**: ${reviews > 0 ? reviews : "none"}`);
    lines.push("\nType `/edu_task` to continue your current topic.");

    console.log(JSON.stringify({ message: lines.join("\n") }));
  } catch (e) {
    const message = "Could not load your dashboard. Try `/edu_status` again.";
    console.log(JSON.stringify({ message, error: e.message }));
  }
}

main();
