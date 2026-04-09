tasks:
  - name: review_reminder
    interval: 24h
    prompt: "Query GET /api/learners/:id/dashboard for each known learner. If pending reviews exist, send a reminder message in their study channel referencing the exact node and action requested."

  - name: escalation_check
    interval: 48h
    prompt: "Check if any learner in remediation status has not submitted in 48h. Flag for attention by sending a message in the learner's study channel noting the inactivity and inviting them to continue."
