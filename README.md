## CLD-Engine Project (Headless Library)

This workspace contains a standalone, headless Causal Loop Diagram (CLD) execution engine.

This `README` is for **you as a human** returning to the project and for **how to talk to Cursor.ai** so it uses the existing docs and rules correctly.

---

### 1. Quick Re-Orientation (What’s here?)

- **Core idea**: A pure TypeScript CLD engine, separate from BaklavaJS, with:
  - Cycles allowed by design.
  - Strategy-based execution (single-pass, multi-pass, convergence).
  - Clear graph + node model and adapter docs for Baklava.
- **Where the design lives**:  
  All architecture and process docs are in `docs/*.mdc` and wired into Cursor via `.cursor/rules/*.mdc`.
- **Current implementation status**:
  - Phase 0 scaffolding is done:
    - `package.json`, `tsconfig.json`, `src/index.ts` placeholder.
  - Core engine code (`src/core`, `src/nodes`, etc.) is **not** yet implemented unless you or Cursor added it after this README.

If you’re unsure what to do next, you almost always want to start by having Cursor read `docs/040-implementation-phases.mdc` and then “implement the next phase”.

---

### 2. How to Start a New Cursor Session Here

When you open this project after some time away, you can say something like:

- **Example prompt (core work)**:

  > “You are working in the `CLD-Engine` project.  
  > Read `docs/000-index.mdc`, `010-goals-and-scope.mdc`, `020-architecture-overview.mdc`, `030-api-design.mdc`, and `040-implementation-phases.mdc`.  
  > Then tell me which implementation phase is next and propose concrete steps.”

- **Example prompt (testing work)**:

  > “In `CLD-Engine`, please read `docs/070-testing-strategy.mdc` and then add basic unit tests for whichever engine/core pieces currently exist.”

- **Example prompt (Baklava integration, in Baklava repo)**:

  > “We have a CLD-Engine library in `/Users/sspycher/Code/CLD-Engine`. Read `CLD-Engine/docs/060-integration-baklava-adapter.mdc`, then design or update an adapter in the Baklava workspace that maps `Editor.graph` into CLD-Engine’s `Graph` and runs `CLDEngine.execute`.”

You don’t have to remember file names; the `.cursor/rules` files already push Cursor toward the right docs, but explicit prompts like the above ensure it doesn’t improvise a new design.

---

### 3. What the `.cursor/rules` Do (and How to Lean on Them)

- **`/.cursor/rules/100-cld-engine-core.mdc`**  
  - Used when implementing or modifying core engine code under `src/`.  
  - Forces Cursor to:
    - Read the main design docs (`000`, `010`, `020`, `030`, `040`).  
    - Respect the “headless, no Baklava imports” rule and the documented public API.
  - **How to use it**:  
    - When you want to progress the engine itself, say:
      > “Implement the next incomplete phase from `docs/040-implementation-phases.mdc` in `CLD-Engine/src`, following `.cursor/rules/100-cld-engine-core.mdc`.”

- **`/.cursor/rules/200-cld-engine-testing.mdc`**  
  - Used when writing tests or debugging behavior.  
  - Pushes Cursor to `docs/070-testing-strategy.mdc` and to keep tests focused and deterministic.
  - **How to use it**:
    - Example:
      > “Use the testing rules in `.cursor/rules/200-cld-engine-testing.mdc` and add tests for SCC/topological sort in `src/core/topology/modifiedTopologicalSort.ts`.”

- **`/.cursor/rules/300-cld-engine-baklava-integration.mdc`**  
  - Used when writing integration/adapter code in the **Baklava repo**.  
  - Forces Cursor to treat CLD-Engine as a headless lib and keep UI/editor concerns in Baklava.
  - **How to use it**:
    - Example (from Baklava workspace):
      > “Follow `CLD-Engine/.cursor/rules/300-cld-engine-baklava-integration.mdc` and implement an adapter that converts Baklava’s `Editor.graph` into a CLD-Engine `Graph` and runs `CLDEngine.execute`.”

You don’t normally need to open the rules yourself, but mentioning them in prompts is a good way to keep Cursor aligned.

---

### 4. Good Interaction Patterns (What to Ask Cursor To Do)

- **Pattern: “Follow the phase plan, don’t reinvent”**

  - Good:
    > “In `CLD-Engine`, implement Phase 1 from `docs/040-implementation-phases.mdc` (core types and graph model). Use the existing API design in `docs/030-api-design.mdc`.”

  - Why: This anchors Cursor to the documented phases and avoids ad-hoc redesigns.

- **Pattern: “Read before writing”**

  - Good:
    > “Before changing any engine logic, read `docs/020-architecture-overview.mdc` and `docs/030-api-design.mdc`, then summarize the current execution model back to me in a few sentences.”

  - Why: Forces it to sync with the existing architecture, which reduces incompatible changes.

- **Pattern: “Scope the task clearly”**

  - Good:
    > “Only touch `CLD-Engine/src/core/Graph.ts` and related types. Do not change strategies, engine, or adapter docs.”

  - Why: Prevents broad, surprising refactors.

---

### 5. Anti-Patterns & Pitfalls (What to Avoid with Cursor Here)

- **Anti-pattern: Letting Cursor redesign the engine from scratch**
  - Bad:
    > “Design a CLD engine however you like.”
  - Risk: It will ignore the existing `docs/*.mdc` and produce a conflicting architecture.
  - Instead:
    - Tie every request to **phases** and **existing docs**.

- **Anti-pattern: Mixing CLD-Engine core code with Baklava-specific logic**
  - Bad (in `CLD-Engine/src`):
    > “Import Baklava’s `Editor` and wire CLDEngine directly to it.”
  - This breaks the **headless** boundary and the integration rules.
  - Instead:
    - Keep engine code clean and create adapters only in the Baklava repo, following `docs/060-integration-baklava-adapter.mdc`.

- **Anti-pattern: Ignoring tests until the end**
  - Bad:
    > “Implement everything, we’ll maybe add tests later.”
  - This makes SCC/back-edge bugs hard to diagnose.
  - Instead:
    - After each major phase (Graph model, topology, engine loop), ask Cursor to add tests per `docs/070-testing-strategy.mdc`.

- **Anti-pattern: Over-restrictive `.cursorignore` / `.cursorindexingignore` changes**
  - Avoid editing these to ignore `src/` or `docs/`. That will starve Cursor of the very information it needs.

---

### 6. “I Forgot Everything, What Now?” – Minimal Recovery Prompt

If you come back months later and don’t remember any of this, you can paste this minimal prompt in a new Cursor chat:

> “We’re in the `CLD-Engine` project.  
> 1) Read `README.md` and `docs/000-index.mdc`.  
> 2) Summarize the current design and what implementation phase we’re in.  
> 3) Propose the next concrete coding task and then implement it, following the `.cursor/rules` files.”

That should be enough for Cursor to fully re-orient and continue implementation along the existing design instead of starting from scratch.

