# Active Context - Kanadle5 Game

Last Updated: 2025-06-04

## Current Focus

Project setup and internal design phases are complete. The focus is now on implementing the core game logic and building the initial UI components for the Kanadle5 Game based on the finalized internal design specifications.

### Active Development Tasks

- **Task 1**: Project structure setup and Next.js installation

  - Status: **Complete**
  - Priority: High
  - Notes: Next.js initialized with TypeScript, Tailwind CSS. Directory structure created. ESLint, Prettier configured. Dependencies added.

- **Task 2**: Internal function design and architecture

  - Status: **Complete**
  - Priority: High
  - Notes: Core functions defined with client-server separation for security. Function execution flow mapped. Open questions documented for future implementation.

- **Task 3**: Define initial component architecture

  - Status: **Complete**
  - Priority: High
  - Notes: Core game components (GameBoard) implemented. State management hooks and keyboard component pending.

- **Task 4**: Implement basic game logic
  - Status: **In Progress**
  - Priority: High
  - Notes: TDD approach - validateWord and evaluateGuess completed with tests. getDailyWord mock implementation completed.

## Recent Changes

### Code Changes

- 2025-06-04: Implemented mock `getDailyWord` function - always returns "つきあかり" for testing purposes
- 2025-06-04: Created comprehensive implementation plan for full getDailyWord functionality with word list persistence
- 2025-06-03: Implemented `evaluateGuess` function with tests - two-pass algorithm for character evaluation with duplicate handling
- 2025-06-03: Created GitHub Actions CI workflow for automated testing on Node.js 22.x and 24.x
- 2025-06-02: Implemented `validateWord` function with tests - handles basic hiragana validation, excludes 'を' character
- 2025-06-02: Set up Jest testing framework for TDD approach
- 2025-06-02: Created game type definitions (`src/types/game.ts`) using `type` instead of `interface`
- 2025-05-02: **Commit `eea3a41` on `feature/implement-gameboard`**: Implemented initial game board component and layout.
- 2025-05-02: **Commit `b69b441`**: Initialized Next.js project with TypeScript and Tailwind CSS. Restored backup files and merged .gitignore.
- 2025-05-02: **Commit `30458a2`**: Set up project directory structure (components, lib, hooks, types) with index files.
- 2025-05-02: **Commit `2eff38b`**: Configured ESLint, Prettier. Added dependencies (LIFF SDK, Vercel KV). Created .env.local.example.
- 2025-05-02: **Commit `6f81821`**: Added type definitions for word list file (`src/types/words.ts`).
- 2025-05-02: **Commit `9100356`**: Merged PR #2 (word type definitions).
- 2025-05-02: Project brief added to memory files.
- 2025-05-02: Technical stack defined.
- 2025-05-02: Word list imported for game dictionary.

### Architecture Decisions

- 2025-06-04: getDailyWord implementation - mock first, full implementation with word list persistence planned
- 2025-06-02: TypeScript policy - use `type` instead of `interface` to prevent implicit declaration merging
- 2025-05-02: Next.js App Router architecture selected for frontend
- 2025-05-02: Vercel KV chosen as primary database for its simplicity and integration
- 2025-05-02: Mobile-first UI approach confirmed with Tailwind CSS

### Requirement Changes

- 2025-06-02: Game rule update - 'を' (wo) character excluded from valid game characters

## Next Steps

### Immediate Next Tasks

1. Complete TDD implementation of core game functions:
   - ✅ `validateWord` function (completed)
   - ✅ `evaluateGuess` function (completed)
   - ✅ `getDailyWord` function (mock implementation completed)
   - 📋 `updateGameState` functions
   - 📋 Full `getDailyWord` implementation with word list persistence
2. Update hiragana keyboard component to exclude 'を' character
3. Verify word dictionary doesn't contain words with 'を'
4. Set up basic game state management using hooks (`src/hooks/useGameState.ts`)

### Upcoming Milestones

- **Milestone 1**: Basic game functionality working locally (Target: Week 1)
- **Milestone 2**: LINE LIFF integration and authentication (Target: Week 2)
- **Milestone 3**: Data persistence and user statistics (Target: Week 3)
- **Milestone 4**: Deployment and testing (Target: Week 4)

## Current Decisions and Considerations

### Recent Decisions

- **Frontend-First Development**: Focus on getting the game UI and mechanics working before backend integration
- **Dictionary Implementation**: Use provided word list as JSON file with server-side daily word selection
- **State Management**: Use React Context API for global state instead of more complex solutions
- **TypeScript Type Definitions**: Exclusively use `type` instead of `interface` to prevent implicit declaration merging bugs
- **Character Exclusion**: 'を' (wo) character is excluded from valid game characters

### Open Questions

- **Daily Word Selection**: What algorithm to use for consistent word selection across all users?
- **Dictionary Validation**: How to efficiently validate user inputs against dictionary?
- **LINE LIFF Testing**: What's the most efficient way to test LINE integration during development?

### Design Questions for Implementation

These questions from the internal design phase need resolution during implementation:

- **Error Handling**: Processing flow for invalid word input, network errors, date change timing
- **Synchronization Issues**: Game switching at midnight, multiple tabs, offline-online transitions
- **API Idempotency**: Handling duplicate submissions and network retry scenarios
- **Game Logic Details**: Character duplicate rules, win/loss determination timing

See `systemPatterns.md#Open Questions for Future Implementation` for detailed specifications.

### Risks and Mitigations

- **Risk 1**: LINE API limitations or changes

  - Likelihood: Medium
  - Impact: High
  - Mitigation: Regular monitoring of LINE platform updates, design with adaptability

- **Risk 2**: Word list quality and appropriateness

  - Likelihood: Medium
  - Impact: Medium
  - Mitigation: Thorough review of word list, implement filtering system

- **Risk 3**: Performance issues on mobile devices
  - Likelihood: Low
  - Impact: High
  - Mitigation: Early performance testing, optimization of React rendering

## Development Environment

### Current Branch

- Branch: feature/implement-get-daily-word-mock
- Status: Mock getDailyWord function implemented with tests. Ready for PR.

### Test Environment

- Local development environment active
- GitHub Actions CI pipeline operational (testing on Node.js 22.x and 24.x)
- LINE LIFF debugging tools to be configured

## Communication Notes

- 2025-05-02: Project brief reviewed and approved
- 2025-05-02: Technical stack decisions finalized
