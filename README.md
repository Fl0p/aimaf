# aimaf

Client-only React SPA that runs a small Mafia-style social deduction game between multiple LLM "players" via OpenRouter.

![Screenshot](1.png)

**Live Demo:** https://fl0p.github.io/aimaf/

**Video Demo:** [aimaf.mov](aimaf.mov)

## How to play

1. Go to **Settings** and set an OpenRouter API key (stored locally in your browser).
2. In **Settings → Models**, load/choose models you want available in the agent creation form.
3. On **Home**, create agents and assign roles.
   - The game flow expects 5 agents with roles like: Mafia, Don, Detective, Doctor, Civilian.
4. Start the game and advance phases with **Next** (or enable **Auto-play**).

### Phases

The game progresses through these phases:

- **Welcome**: initializes the game and sends role info (some messages are private / mafia-only).
- **Night**: mafia-only discussion (tool usage is ignored).
- **Actions**: active roles act using tools:
  - Mafia/Don: `kill`
  - Detective: `check`
  - Doctor: `save`
- **Day**: two rounds of public discussion.
- **Voting**: all alive players vote using `vote`, then the elimination is applied.

### Tools

Agents can call tools (when allowed by phase/role):

- `kill { playerName }` (Mafia)
- `check { playerName }` (Detective)
- `save { playerName }` (Doctor)
- `vote { playerName }` (Everyone, during Voting)

## Settings & storage

This app stores configuration in browser `localStorage`:

- `openrouter_api_key`: OpenRouter API key
- `selected_models`: selected model list used by the agent creation UI
- `mafia_prompts`: per-role prompt templates (editable in Settings)

## Development

### Technical Details

- UI: React App + TypeScript
- Routing: `HashRouter` (`#/` URLs)
- Persistence: browser `localStorage` (no backend)
- Model calls: OpenRouter + `ai` SDK tool loop

### Quick start

1. Install deps
   - `yarn`
2. Run dev server
   - `yarn start`
3. Open the app
   - `http://localhost:3000`


### Commands

Run from repo root:

- `yarn start` — dev server at `http://localhost:3000`
- `yarn test` — Jest (CRA) in watch mode
- `yarn build` — production build to `build/`
- `yarn serve` — build + serve production build locally

Note: there is no separate lint command; CRA ESLint runs during `start`/`test`/`build`.

### High-level code map

**Core:**
- `src/App.tsx` — router and routes
- `src/types/index.ts` — core domain types (roles, phases, messages, game state)

**Pages:**
- `src/pages/Home.tsx` — main game UI (agents + chat)
- `src/pages/Settings.tsx` — API key, model selection, prompt editing

**Game Logic:**
- `src/hooks/useChat.ts` — game state machine + phase orchestration
- `src/utils/gameStatus.ts` — game status calculation and win conditions
- `src/utils/DayActions.ts` — voting logic and vote processing
- `src/utils/NightActions.ts` — night phase actions (kill, check, save)
- `src/utils/helpers.ts` — utility functions

**Agents:**
- `src/agents/ChatAgent.ts` — OpenRouter + `ai` SDK tool loop agent wrapper
- `src/agents/MafiaPrompts.ts` — role-specific prompt templates and management

**Components:**
- `src/components/Header.tsx` — navigation header with game controls
- `src/components/AgentPanel.tsx` — agent list and management
- `src/components/AgentCard.tsx` — individual agent display
- `src/components/AgentForm.tsx` — agent creation form
- `src/components/ChatMessages.tsx` — message list container
- `src/components/AgentMessage.tsx` — individual message display
- `src/components/MessageBubble.tsx` — message bubble UI
- `src/components/MessageHeader.tsx` — message header with sender info
- `src/components/ChatInput.tsx` — chat input (if used)
- `src/components/AgentInfo.tsx` — agent information display
- `src/components/GitHubLogo.tsx` — GitHub logo link component

