# API contracts

When changing backend Java API records, enums, dependencies, or schema generation:

- Run `node scripts/sync-api-contracts.mjs --clean` from the repository root.
- Include both generated `contracts.ts` files in the change (web and mobile).
- Do not hand-edit generated contracts or remove CI's drift check.
- Run `node scripts/install-git-hooks.mjs` for a new checkout. Dependency installation also installs the hook, preserving existing custom hooks.
