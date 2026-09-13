# Rule: Mandatory Deep Brief Analysis & Dynamic Planning

## Trigger Condition
This rule applies whenever generating, regenerating, or refactoring AI project plans based on a user-provided brief.

---

## Directives

1. **Authoritative Brief Primacy**:
   - The user-provided brief text is the single source of truth.
   - Project titles or legacy metadata must NEVER override or contaminate the current brief requirements.

2. **Mandatory Deep Semantic Fact Extraction**:
   - Before synthesizing tasks, the AI MUST extract exact semantic facts:
     - Exact team size & roles (e.g. 5 members: curator, developer, designer...).
     - Exact number & nature of deliverables (e.g. 12 interactive artworks, responsive web app...).
     - Timeline duration & target audience metrics (e.g. 5 weeks, 150 visitors).
   - Metrics and numbers MUST preserve their semantic meaning (e.g. 12 artworks != 12 project deliverables).

3. **Framework vs. Content Separation**:
   - `FRAMEWORK` = Process Skeleton (HOW work is structured across phases).
   - `BRIEF` = Project Content (WHAT tasks, deliverables, technologies, and roles are created).
   - Never copy static domain tasks from framework templates into unrelated project briefs.

4. **Dynamic Task Count Scaling**:
   - Task count must scale dynamically with brief scope and complexity.
   - Small projects: 3–5 high-impact workstreams.
   - Large projects: 6–15 detailed, actionable workstreams.
   - Avoid shallow 1-to-1 verbatim list splitting and generic filler tasks.
