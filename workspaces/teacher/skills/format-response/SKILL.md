# Skill: format-response

Format all learner-facing messages for Discord, respecting length budgets and tone rules from SOUL.md.

---

## Message Types and Formatting Rules

### Explanation

Use when introducing or re-explaining a node concept.

- **Length**: 3–8 sentences.
- **Structure**: Start with what the concept is, then why it matters, then how it connects.
- **Concrete examples**: Include at least one specific, real example.
- **End**: Always end with 1–3 actionable next steps.
- **Discord markdown**: Use `**bold**` for key terms. Use ` ```code blocks``` ` for technical identifiers or commands.

Example closing lines:
> **Next steps:**
> - Type `/task` to attempt an assessment on this node.
> - Type `/explain` again if you want me to go deeper on a specific aspect.

---

### Task Prompt

Use when issuing a 5-slot assessment task.

- **Structure**: One short instruction sentence, then list all five required slots with a brief per-slot instruction.
- **Format**: Numbered list, each slot labeled clearly.
- **Discord markdown**: Use `**Slot N — SlotName**` headers for each slot.

Template:

```
Answer the following 5 slots for **[Node Name]**. Write at least 2–3 sentences per slot.

**Slot 1 — Definition**: What is [concept] precisely? Give a clear, accurate definition.
**Slot 2 — Importance**: Why does [concept] matter? Explain the consequence of ignoring it.
**Slot 3 — Relation**: How does [concept] connect to [related concept]? Describe the dependency or interaction.
**Slot 4 — Example**: Give a concrete, specific example of [concept] in action.
**Slot 5 — Boundary**: What is [concept] NOT? Describe a common misconception or adjacent concept it is often confused with.
```

---

### Evaluation Feedback

Use after receiving evaluation results from the API.

- **Structure**:
  1. Slot-by-slot breakdown: one sentence per slot noting strength or gap.
  2. Overall verdict: **Pass**, **Fail**, or **Remediation** — stated clearly.
  3. Rationale: 1–2 sentences explaining why the verdict was reached.
  4. Next action: exactly what the learner should do next.
- **Constructive language**: Never use "wrong" or "incorrect" alone — pair with what to improve.
- **No dead ends**: Always end with a specific next step.

Pass example:
> **Slot 1 — Definition**: Clear and precise. ✓  
> **Slot 2 — Importance**: Strong — you connected it to real consequences. ✓  
> **Slot 3 — Relation**: Good link to [adjacent concept]. ✓  
> **Slot 4 — Example**: Specific and relevant. ✓  
> **Slot 5 — Boundary**: You identified the boundary clearly. ✓  
>
> **Overall: Pass** — You demonstrated solid understanding across all five dimensions.  
>
> **Next steps:**  
> - Type `/next` to advance to the next node.  
> - Type `/review` to schedule a spaced-repetition review for this concept.

Fail example:
> **Slot 1 — Definition**: Accurate but too general — be more precise about [specific aspect]. ⚠  
> **Slot 4 — Example**: The example was abstract. Try grounding it in a specific scenario. ⚠  
> (other slots: brief positive note)  
>
> **Overall: Fail** — The definition and example need more specificity before you advance.  
>
> **Next steps:**  
> - Revise slots 1 and 4, then type `/task` to resubmit.  
> - Type `/explain` if you'd like me to walk through the concept again.

---

## General Discord Formatting Rules

- Use `**bold**` for slot names, verdicts, and key terms.
- Use ` ```code blocks``` ` for API paths, command names, and technical identifiers.
- Use `>` blockquotes sparingly for important callouts.
- Keep each section visually separated with a blank line.
- Avoid walls of text — break into short paragraphs or lists.
- Every message must end with a **Next steps** section containing 1–3 items.
