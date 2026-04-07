# Contributing

Thank you for contributing to PaperNest Client.

## Code Of Conduct

By participating in this project, you agree to follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Reporting Bugs

Please use the bug report template: [Bug report](./.github/ISSUE_TEMPLATE/bug_report.yml).

Include:

- What happened
- How to reproduce it
- Expected behavior
- Logs/screenshots (if available)

## Requesting Features

Please use the feature request template: [Feature request](./.github/ISSUE_TEMPLATE/feature_request.yml).

Describe the user problem first, then propose the solution.

## Development Setup

1. Clone and enter the project:

```bash
git clone <repo-url>
cd frontend/PaperNest_Client_Next
```

2. Install dependencies:

```bash
pnpm install
```

3. Configure environment:

```bash
cp .env.example .env.local
```

4. Start development server:

```bash
pnpm dev
```

5. Run quality checks:

```bash
pnpm lint
pnpm build
pnpm vitest --run --passWithNoTests
```

## Branching Strategy

- `main`: stable branch
- `feat/*`: new features
- `fix/*`: bug fixes
- `chore/*`: maintenance and non-feature work

## Commit Message Format

Use Conventional Commits:

- `feat: add workspace invitation table`
- `fix: prevent null user in liveblocks auth`
- `docs: update setup instructions`

## Pull Request Checklist

- [ ] Tests added or updated
- [ ] Documentation updated
- [ ] CHANGELOG entry added
- [ ] No secrets or credentials committed

## Code Review Process

- At least one reviewer approval is required before merge.
- Resolve all review comments or document why not addressed.
- Keep PRs focused and small where possible.
- Rebase or merge from `main` before final approval when needed.
