# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `yarn start` - dev server at localhost:3000
- `yarn build` - production build to `build/`
- `yarn test` - run tests in watch mode (Jest via CRA)
- `yarn test -- --testPathPattern="filename"` - run specific test file
- `yarn serve` - build and serve production locally

Note: No separate lint command; CRA ESLint runs during `start`/`test`/`build`.

## Architecture

Client-only React SPA (Create React App + TypeScript) that runs a Mafia social deduction game between LLM agents via OpenRouter.

### Game Flow

The game is a state machine managed by `useChat` hook with phases:
```
Welcome → Night → Actions → Day → Voting → Night → ... (until win condition)
```

- **Welcome**: Game initialization, role assignments, private messages to special roles
- **Night**: Mafia-only discussion (tool calls ignored)
- **Actions**: Role-based tool execution (kill/check/save)
- **Day**: Two rounds of public discussion (all alive agents)
- **Voting**: All players vote, elimination applied

### Key Architecture Patterns

**Agent System** (`src/agents/ChatAgent.ts`):
- Wraps Vercel AI SDK's `ToolLoopAgent` with OpenRouter provider
- Each agent has role-specific tools (kill, check, save, vote) defined via zod schemas
- Tools are phase-gated: actions only execute during appropriate phases
- Message visibility filtering: mafia-only (`mafia: true`) and private (`pm: true`) messages

**State Machine** (`src/hooks/useChat.ts`):
- Central game orchestration: phase transitions, agent turns, action processing
- `NightActions` and `DayActions` utilities collect and resolve actions at phase boundaries
- Uses refs (`messagesRef`, `nightActionsRef`, `dayActionsRef`) for synchronous state access during async agent loops

**Message Types** (`src/types/index.ts`):
- Messages have visibility flags: `pm` (private to one agent), `mafia` (mafia-only)
- Tool calls tracked via `toolCalls` array and `toolResultFor` for response linkage

### Storage Keys (localStorage)

- `openrouter_api_key` - OpenRouter API key
- `selected_models` - Model list for agent creation UI
- `mafia_prompts` - Per-role prompt templates (editable in Settings)
