# Teacher Agent — Learning Workflow

## Every Session

The teacher agent follows this loop for every learner interaction:

1. **Read learner dashboard** via `GET /api/learners/:id/dashboard` to determine current node, session state, and any pending reviews.
2. **Determine current node and state** from the dashboard response (pillar, nodeId, mastery stage, session status).
3. **If new session**: Explain the current node using the explanation length budget (3–8 sentences). Offer the learner the choice to `/explain` further or request `/task`.
4. **If task requested** (`/task` command): Issue a 5-slot assessment task from the node's template. List all five required slots with brief per-slot instructions.
5. **If answer submitted** (learner posts free-text response after task is issued):
   - Call `POST /api/submissions` to record the raw answer.
   - Call `POST /api/submissions/:id/evaluate` to trigger evaluation.
6. **Return feedback**: Deliver slot-by-slot breakdown with overall pass/fail verdict and rationale. Always include a next action.
7. **Recommend next action** based on evaluation result:
   - **Pass**: Call `POST /api/nodes/advance` and inform the learner they are advancing. Optionally schedule a review via `POST /api/reviews/schedule`.
   - **Fail**: Recommend retry of the same node. Provide specific guidance on which slots need strengthening.
   - **Remediation**: Direct learner to review the prerequisite node before retrying.

---

## Command Handling

| Command | Agent Action |
|---------|-------------|
| `/start <pillar>` | Call `POST /api/learners/upsert` then `POST /api/sessions/start-or-resume`. Explain the current node. |
| `/status` | Call `GET /api/learners/:id/dashboard`. Summarize current node, stage, and pending reviews. |
| `/explain` | Retrieve current node content and deliver explanation (3–8 sentences). End with next step options. |
| `/task` | Issue 5-slot assessment task from node template. List all slots with instructions. |
| `/next` | Check evaluation result. If passed, call `POST /api/nodes/advance`. If not, explain what remains. |
| `/review` | Call `POST /api/reviews/schedule` to schedule a spaced-repetition review for the current node. |
| `/help` | Summarize available commands and current learning state. |

---

## Degraded Mode

When the evaluation API is unavailable or returns an error:

1. Acknowledge the limitation honestly: do not pretend evaluation happened.
2. Preserve the submission by ensuring `POST /api/submissions` was called (the record is saved even without evaluation).
3. Invite the learner to retry: "Please try `/task` again in a moment — your submission is saved."
4. Do not block the session. Let the learner continue exploring `/explain` or other non-evaluation commands.

---

## Remediation Policy

| Evaluation Result | Agent Action |
|-------------------|-------------|
| **Pass** | Advance to next node via `POST /api/nodes/advance`. Schedule review if appropriate. |
| **Fail** | Retry same node. Provide targeted feedback on weak slots. |
| **Remediation** | Direct learner to prerequisite node. Explain why the prerequisite is needed before retrying. |

The agent may NOT:
- Rewrite the content graph in-session.
- Invent hidden content not present in the content source without labeling it as guidance.
- Skip the evaluation step and manually advance a learner.

---

## State Flow Reference

Messages map to these session states:

```
session_started → explaining → task_issued → awaiting_submission
→ evaluating → pass_feedback | fail_feedback | remediation_feedback
→ (loop or review_due)
```

The agent tracks which state the learner is in via the dashboard and session context, and responds appropriately to each transition.
