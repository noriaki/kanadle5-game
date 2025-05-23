# Technical Context

## Technology Stack

### Frontend

- **Framework**: Next.js (App Router)
- **State Management**: React Context API / React Hooks
- **UI Components**: Custom components with React
- **Styling**: Tailwind CSS
- **Testing**: Jest for unit tests, React Testing Library for component tests
- **Build Tools**: Next.js built-in build system

### Backend

- **Language**: TypeScript/JavaScript (Node.js runtime)
- **Framework**: Next.js API Routes
- **API**: REST API
- **Database**: Vercel KV (Redis-compatible) or Supabase
- **Caching**: Vercel KV for caching
- **Authentication**: LINE Login (LIFF)
- **Testing**: Jest for API testing

### Infrastructure

- **Hosting**: Vercel
- **CI/CD**: Vercel GitHub integration
- **Monitoring**: Vercel Analytics
- **Containerization**: N/A (Serverless deployment)
- **Orchestration**: N/A (Managed by Vercel)
- **Cloud Services**: Vercel KV, Vercel Edge Functions

## Development Environment Setup

### Prerequisites

- Node.js LTS (v18+)
- npm or yarn
- Git
- LINE Developer account
- Vercel account (for deployment)

### Setup Instructions

1. Clone the repository
2. Install dependencies with `npm install` or `yarn`
3. Set up environment variables for local development
4. Run the development server with `npm run dev` or `yarn dev`

### Environment Configuration

```
# LINE LIFF Configuration
NEXT_PUBLIC_LIFF_ID=your-liff-id
LIFF_CHANNEL_ID=your-channel-id
LIFF_CHANNEL_SECRET=your-channel-secret

# Database Configuration
VERCEL_KV_URL=your-vercel-kv-url
VERCEL_KV_REST_API_TOKEN=your-vercel-kv-token

# Game Configuration
DAILY_WORD_REFRESH_TIME=00:00:00 # Japan time
```

### Local Development Workflow

1. Start the development server
2. Test with LINE LIFF Simulator for LINE-specific features
3. Use browser developer tools for debugging
4. Implement features and run tests locally
5. Commit changes and push to GitHub for deployment

## External Dependencies

### APIs

- **LINE LIFF API**:
  - Purpose: Integration with LINE for mini app functionality
  - Documentation: https://developers.line.biz/en/docs/liff/
  - Authentication: LIFF ID, Channel ID, Channel Secret
  - Rate Limits: Standard LINE API rate limits
  - Environment Variables: NEXT_PUBLIC_LIFF_ID, LIFF_CHANNEL_ID, LIFF_CHANNEL_SECRET

- **LINE Login API**:
  - Purpose: User authentication
  - Documentation: https://developers.line.biz/en/docs/line-login/
  - Authentication: Same as LIFF
  - Rate Limits: Standard LINE API rate limits
  - Environment Variables: Same as LIFF

### Libraries and Packages

- **@line/liff**:
  - Purpose: LINE Front-end Framework SDK
  - Documentation: https://developers.line.biz/en/reference/liff-api/
  - Version: Latest stable
  - Notes: Required for LINE Mini App functionality

- **@vercel/kv**:
  - Purpose: Redis-compatible key-value database
  - Documentation: https://vercel.com/docs/storage/vercel-kv
  - Version: Latest stable
  - Notes: Used for storing game state, user data, and daily words

## Technical Constraints

- Must comply with LINE Mini App specifications and guidelines
- Mobile-first design required for optimal LINE experience
- Maximum response time for API calls should be under 1 second
- Must support all browsers compatible with LINE LIFF
- Resource usage must stay within Vercel free/paid plan limitations

## Deployment Process

### Environments

- **Development**:
  - URL: [Generated by Vercel per-branch]
  - Deployment Process: Automatic deployment from feature branches
  - Access: Development team only

- **Staging**:
  - URL: [kanadle5-staging.vercel.app]
  - Deployment Process: Automatic deployment from main branch
  - Access: Development team and testers

- **Production**:
  - URL: [kanadle5.vercel.app]
  - Deployment Process: Manual promotion from staging
  - Access: Public via LINE

### Deployment Checklist

- All tests passing
- Performance audit completed
- Security checks passed
- LINE LIFF configuration verified
- Database migrations applied if needed
- Accessibility requirements met

## Performance Benchmarks

- Initial load time under 3 seconds
- Time-to-interactive under 4 seconds
- API response time under 500ms
- Core Web Vitals metrics meeting "Good" thresholds

## Security Requirements

- Secure LINE authentication implementation
- Protection against common web vulnerabilities (XSS, CSRF)
- No sensitive data stored in client-side storage
- Rate limiting for API endpoints
- Data validation for all user inputs

## Game-Specific Technical Details

### Word List Implementation

- Word list stored as JSON in the codebase, with additional copy in database
- Daily word selection algorithm uses date as seed for consistent selection
- System ensures same word is provided to all users on a given day
- Word validation against dictionary for player submissions

### Hiragana Input System

- Custom on-screen keyboard for hiragana input
- Color-coding of keyboard keys based on guess results
- Input validation to ensure only basic hiragana characters

### Game State Management

- Game state stored in React Context/hooks for client-side gameplay
- Persistent storage in database for logged-in users
- Daily reset mechanism triggered at midnight Japan time

### Sharing Functionality

- Emoji-based results generation (similar to Wordle)
- Integration with LINE sharing API
- Non-spoiler format maintaining game integrity
