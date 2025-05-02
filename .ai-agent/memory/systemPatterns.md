# System Patterns - Kanadle Game

## Architecture Overview

Kanadle Game follows a modern frontend-focused architecture built with Next.js, leveraging server-side and client-side rendering as appropriate. The application integrates with LINE's LIFF platform for authentication and sharing, while using Vercel KV as a lightweight data store.

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────────┐      ┌──────────────┐  │
│  │             │      │              │  │
│  │   Next.js   │◄────►│  LINE LIFF   │  │
│  │   Frontend  │      │  Platform    │  │
│  │             │      │              │  │
│  └─────┬───────┘      └──────────────┘  │
│        │                                │
│        ▼                                │
│  ┌─────────────┐      ┌──────────────┐  │
│  │             │      │              │  │
│  │   Next.js   │◄────►│  Vercel KV   │  │
│  │   API Routes│      │  Database    │  │
│  │             │      │              │  │
│  └─────────────┘      └──────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Key Architecture Principles

- **Frontend-First**: Core game logic runs on the client for immediate feedback
- **JAMstack Approach**: Static generation where possible, API routes for dynamic data
- **Mobile Optimization**: Performance and UX optimized for mobile devices
- **Serverless**: Leveraging serverless functions and storage for scalability
- **Minimal State Management**: Simple, focused state without complex libraries

## System Components

### Component 1: Game Core

- **Purpose**: Manage core gameplay logic and user interactions
- **Responsibilities**: 
  - Process user inputs and validate against game rules
  - Track game state and update UI accordingly
  - Calculate results and maintain game history
- **Interfaces**:
  - Provides: Game state, validation functions, hiragana input handling
  - Consumes: Word dictionary, daily word selection
- **Technical Details**: Implemented using React hooks and context for state management

### Component 2: LINE Integration

- **Purpose**: Handle all LINE platform interactions
- **Responsibilities**: 
  - Authenticate users via LINE Login
  - Retrieve user profile information
  - Enable result sharing to LINE
- **Interfaces**:
  - Provides: Authentication status, user profile, sharing functions
  - Consumes: Game results for sharing
- **Technical Details**: Uses LINE LIFF SDK with custom React hooks for integration

### Component 3: Data Persistence

- **Purpose**: Store and retrieve game data
- **Responsibilities**: 
  - Save user game history and statistics
  - Retrieve daily word challenges
  - Persist user preferences
- **Interfaces**:
  - Provides: Data access and storage functions
  - Consumes: User ID, game results, preferences
- **Technical Details**: Implemented with Vercel KV, with fallback to local storage for anonymous users

### Component 4: UI System

- **Purpose**: Present game interface and visual feedback
- **Responsibilities**: 
  - Display game board and keyboard
  - Provide visual feedback on game progress
  - Adapt to different screen sizes
- **Interfaces**:
  - Provides: Visual components and responsive layouts
  - Consumes: Game state, user inputs
- **Technical Details**: Built with React components styled with Tailwind CSS

## Data Models

### Data Model 1: Word Dictionary

```json
[
  {
    "kana": "あいうえお",  // 5-character hiragana word
    "word": "アイウエオ"   // Kanji/katakana equivalent for display
  }
]
```

- **Description**: Collection of valid 5-character hiragana words with their meanings. The structure is defined by the `WordEntry` and `WordList` types in `src/types/words.ts`.
- **Validation Rules**: Must be exactly 5 characters, basic hiragana only. Structure enforced by TypeScript types.
- **Storage**: JSON file (`src/data/words.json`) in codebase, potentially cached or copied to database.
- **Usage**: For daily word selection and validating user guesses against the dictionary.

### Data Model 2: Game State

```typescript
interface GameState {
  currentWord: string;            // Daily target word
  attempts: string[];             // User's previous guesses
  currentAttempt: string;         // Current in-progress guess
  gameStatus: 'active'|'won'|'lost'; // Current game status
  letterStatus: Record<string, 'correct'|'present'|'absent'|'unused'>; // Status of each hiragana
  date: string;                   // Date of this game (YYYY-MM-DD)
}
```

- **Description**: Represents the current state of an active game
- **Validation Rules**: Attempts must be valid dictionary words, status values must be valid
- **Storage**: React state during play, Vercel KV for persistence
- **Usage**: Core game logic and UI rendering

### Data Model 3: User Profile

```typescript
interface UserProfile {
  userId: string;           // LINE user ID
  displayName: string;      // User's name from LINE
  pictureUrl?: string;      // User's profile picture URL
  statusMessage?: string;   // User's status message
  language?: string;        // User's language setting
}
```

- **Description**: User information retrieved from LINE
- **Validation Rules**: Valid LINE user ID required
- **Storage**: Vercel KV, with temporary session storage
- **Usage**: User identification and personalization

### Data Model 4: User Statistics

```typescript
interface UserStatistics {
  userId: string;           // LINE user ID
  gamesPlayed: number;      // Total games played
  gamesWon: number;         // Games successfully completed
  currentStreak: number;    // Current consecutive days played
  maxStreak: number;        // Maximum consecutive days played
  guessDistribution: Record<number, number>; // Distribution of guesses needed to win
  lastPlayed: string;       // Date of last completed game
}
```

- **Description**: Tracks user's gameplay history and statistics
- **Validation Rules**: Non-negative numbers, valid user ID
- **Storage**: Vercel KV
- **Usage**: Performance history display and streak tracking

## API Patterns

### RESTful API Guidelines

- **URL Structure**: `/api/[resource]/[id]` format
- **Resource Naming**: Plural nouns (e.g., `/api/games`)
- **HTTP Methods**: 
  - GET: Retrieve data
  - POST: Create new data
  - PUT: Update existing data
  - DELETE: Remove data
- **Status Codes**: Standard HTTP status codes (200, 201, 400, 401, 404, 500)
- **Error Handling**: Consistent error objects with code and message
- **Versioning**: Version in path if needed (`/api/v1/...`)

### API Endpoints

1. **User API**
   - `GET /api/user` - Get current user profile
   - `GET /api/user/statistics` - Get user statistics

2. **Game API**
   - `GET /api/game/daily` - Get today's game
   - `POST /api/game/result` - Submit game result

3. **Dictionary API**
   - `POST /api/dictionary/validate` - Validate a word

## Design Patterns

### Frontend Patterns

- **Component Structure**: 
  - Atomic design principles
  - Presentational vs. container components
  - Clear component responsibilities

- **State Management**: 
  - React Context for app-wide state
  - Local state for component-specific needs
  - Custom hooks for reusable logic

- **Styling Approach**: 
  - Tailwind CSS for utility-first styling
  - Mobile-first responsive design
  - Consistent color variables

- **Responsive Design**: 
  - Mobile-first breakpoints
  - Viewport units for appropriate sizing
  - Touch-friendly UI elements

- **Accessibility**: 
  - Semantic HTML
  - ARIA attributes where needed
  - Keyboard navigation support
  - Sufficient color contrast

### Backend Patterns

- **Service Organization**: 
  - Separation of concerns
  - Business logic isolated from API layer
  - Modular service functions

- **Error Handling**: 
  - Consistent error structure
  - Proper HTTP status codes
  - Informative but secure error messages

- **Caching**: 
  - Cache daily words
  - Cache dictionary validation results
  - Browser caching for static assets

- **Security**: 
  - Input validation
  - Rate limiting
  - Authentication via LINE LIFF

## Performance Considerations

- Mobile-first performance optimizations
- Static generation of non-dynamic content
- Minimal JavaScript payload
- Optimized asset loading
- Efficient state updates to minimize re-renders
- Lazy loading for non-critical components

## Security Patterns

- **Authentication**: LINE Login via LIFF
- **Authorization**: Session validation for protected operations
- **Data Protection**: No sensitive data stored, minimal personal info
- **Input Validation**: Server-side validation of all inputs
- **Rate Limiting**: Protect against abuse of API endpoints

## Testing Strategy

- **Unit Testing**: 
  - Core game logic
  - Utility functions
  - Component rendering

- **Integration Testing**: 
  - API endpoints
  - User flows
  - State management

- **End-to-End Testing**: 
  - Complete game flows
  - Authentication process
  - Result sharing

- **Performance Testing**: 
  - Load time benchmarks
  - Interaction responsiveness
  - API response times

- **Security Testing**: 
  - Authentication flow verification
  - Input validation
  - Safe data handling practices
