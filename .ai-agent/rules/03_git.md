# Git and Version Control Guidelines

## GitHub Flow Branching Strategy

- **Main Branch**: `main` - Contains production-ready code
- **Feature Branches**: `feature/[feature-name]` - For new features
- **Bugfix Branches**: `bugfix/[issue-id]` - For bug fixes
- **Hotfix Branches**: `hotfix/[issue-id]` - For urgent fixes

**Important Rules**:

- No direct commits or merges to the `main` branch
- All changes must be made through GitHub Pull Requests
- Pull Requests must be reviewed and approved by the user before merging

## Commit Guidelines

### Commit Message Format

```text
[type]: [concise description]

[detailed description (optional)]

[references (optional)]
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code refactoring without functionality change
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks, dependencies, etc.

### Commit Best Practices

- Make small, focused commits
- Write clear, descriptive commit messages
- Reference issues or tickets when applicable
- Ensure each commit leaves the codebase in a working state
- Separate refactoring commits from feature/fix commits

## Pull Request Process

1. Create feature/bugfix branch from `main`
2. Implement changes with proper tests
3. Ensure all tests pass
4. Create pull request with:
   - Clear description of changes
   - Reference to related issues
   - Test results
   - Any deployment considerations
5. Wait for user review
6. Address review feedback thoroughly:
   - Respond to all comments on the PR
   - Make requested code changes
   - Push updates to the same branch
   - Continue discussion in the PR until all issues are resolved
7. User will approve and merge the PR when satisfied
8. After the PR is merged, clean up branches:
   - Update local main branch
   - Delete the local feature branch
   - Delete the remote feature branch

## Code Review Guidelines

- Review code for:
  - Functionality
  - Security
  - Performance
  - Maintainability
  - Adherence to project patterns
  - Test coverage
- Provide constructive feedback
- Use inline comments for specific issues

## GitHub Flow Workflow

### Starting New Work

```bash
git checkout main
git pull
git checkout -b feature/[feature-name]
```

### Regular Commits

```bash
git add [files]
git commit -m "type: descriptive message"
```

### Creating Pull Request

```bash
git push -u origin feature/[feature-name]
# Then create PR on GitHub from feature/[feature-name] to main
```

### Responding to PR Feedback

1. Make requested changes locally
2. Commit and push to the feature branch
3. Respond to comments on GitHub PR
4. Document all discussions in the PR for future reference

### After PR is Merged by User

```bash
git checkout main
git pull
git branch -d feature/[feature-name]         # Delete local branch
git push origin --delete feature/[feature-name]  # Delete remote branch
```

## Development Phase Management

### End of Phase Tasks

At the end of each development phase, the following tasks must be completed in order:

#### 1. Quality Assurance

Execute all quality checks using pnpm:

```bash
pnpm run typecheck
pnpm run lint
pnpm run format
pnpm test
```

All checks must pass before proceeding to the next steps.

#### 2. Memory File Updates

Update project memory files to reflect current status:

- `.ai-agent/memory/activeContext.md` - Current project focus and status
- `.ai-agent/memory/progress.md` - Progress tracking and milestone updates
- Other memory files as needed based on the phase content

#### 3. Git Operations

- Verify current branch: `git branch`
- Commit changes with appropriate granularity (feature-based, TDD cycle-based)
- Use proper commit message format (see Commit Guidelines above)
- Push to remote: `git push -u origin [branch-name]`

#### 4. Pull Request Creation and Review

- Create PR using `mcp__github__create_pull_request`
- Include comprehensive description with:
  - Summary of changes
  - Test results
  - Any relevant context
- Request user review
- Wait for approval and merge
- Clean up branches after merge:
  - Update local main branch
  - Delete local feature branch
  - Delete remote feature branch

### Package Management with pnpm

This project uses pnpm for package management. Always use pnpm commands:

- **Install dependencies**: `pnpm install`
- **Add package**: `pnpm add [package]`
- **Add dev dependency**: `pnpm add -D [package]`
- **Remove package**: `pnpm remove [package]`
- **Run scripts**: `pnpm run [script-name]`

## GitHub Integration

- Link commits to issues using keywords (Fixes #123, Closes #456)
- Use GitHub Actions for CI/CD when configured
- Protect branches with appropriate rules
- Use GitHub Projects for task tracking when applicable

## MCP Server Integration

- **Primary Tools**: Always use `mcp__git` and `mcp__github` tools for Git and GitHub operations
- **Tool Verification**: Prior to performing Git/GitHub operations, verify MCP server availability
- **Fallback Approach**: Only use standard Git commands when MCP tools are unavailable or return errors
- **Example Operations**:
  - Use `mcp__git__git_status` instead of `git status`
  - Use `mcp__github__create_pull_request` instead of manual PR creation
  - Use `mcp__git__git_commit` instead of `git commit`
- **Error Handling**: If MCP tools return errors, document the issue and fall back to shell commands
