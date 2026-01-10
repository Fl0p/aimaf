# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

All commands are intended to be run from the repository root.

- `yarn start` — Run the development server (Create React App) at `http://localhost:3000`.
- `yarn build` — Create a production build in `build/`.
- `yarn test` — Run the Jest test runner in watch mode (via `react-scripts test`).
- `yarn serve` — Build the app and serve the production build locally.

Notes:
- Linting is handled by Create React App's built-in ESLint config (`react-app`, `react-app/jest`). There are no separate lint scripts; linting runs automatically during `yarn start`, `yarn test`, and `yarn build`.
- When working on tests, use the interactive Jest/CRA UI provided by `yarn test` to narrow to specific test files or test names.

## High-level architecture

### Overview

- Client-only React single-page application created with Create React App + TypeScript.
- Uses `HashRouter` from `react-router-dom` for routing, so URLs use `#/` fragments.
- No backend in this repo; all persistence is via `localStorage` and all model interaction is directly with the OpenRouter HTTP API.

### Routing and pages

- `src/index.tsx` — React entry point; renders `<App />` into `#root`.
- `src/App.tsx` — Sets up the `HashRouter` and route configuration:
  - `/` → `Home` page.
  - `/settings` → `Settings` page.

### Domain model and types

Defined in `src/types/index.ts`:

- `MessageSender` — Distinguishes `System`, `Moderator`, and `Agent` messages.
- `MafiaRole` — The semantic role for an agent in the Mafia-style game (`Mafia`, `Civilian`, `Detective`, `Doctor`, `Don`).
- `GameState` — High-level game lifecycle (`Initial`, `Started`, `Ended`).
- `Message` — Chat message shape shared across the app.
- `AgentConfig` — Serializable configuration for an agent (id, name, model, system prompt, color, Mafia role).
- `OpenRouterModel` — Minimal representation of a model returned from the OpenRouter models API.

These types form the core domain layer that connects pages, hooks, and the `ChatAgent` class.

### Chat and agent orchestration

#### `useChat` hook (`src/hooks/useChat.ts`)

Central state and behavior for the main experience:

- Holds React state for:
  - `messages: Message[]` — Ordered chat history.
  - `agents: ChatAgent[]` — In-memory agent instances.
  - `isLoading: boolean` — Indicates an in-flight agent call.
  - `activeAgentId: string | null` — Which agent is currently responding.
  - `gameState: GameState` — Overall game lifecycle.
- Uses `localStorage` key `openrouter_api_key` to access the OpenRouter API key before creating or invoking agents.
- Exposes callbacks consumed by the UI:
  - `sendMessage` — Append a moderator message.
  - `askAgent` — Given a `ChatAgent`, call its `generate` method with the current `messages` history and append the agent's reply.
  - `addAgent` — Create a new `ChatAgent` from a partial `AgentConfig` and the stored API key; extend `agents`.
  - `removeAgent` — Remove an agent by id.
  - `clearMessages` — Reset chat history.
  - `startGame` — Move state to `Started` and append a system message announcing the start.

The `Home` page is effectively a thin container over `useChat`, wiring this state and these callbacks into presentational components.

#### `ChatAgent` (`src/agents/ChatAgent.ts`)

Wrapper around the `ai` SDK and OpenRouter provider:

- Constructed with an `AgentConfig` and an OpenRouter API key.
- Internally creates an `openrouter` client via `createOpenRouter({ apiKey })` and a `ToolLoopAgent` with:
  - `model` derived from `config.model`.
  - `instructions` from `config.systemPrompt`.
  - An empty `tools` set for now.
- `generate(messages: Message[]): Promise<string>`:
  - Maps internal `Message` instances to `ModelMessage`s for the `ai` SDK.
  - Uses `MessageSender` to choose `user` vs `assistant` roles and to decorate agent messages with `[agentName]:` prefixes.
  - Delegates to `this.agent.generate({ messages })` and returns the resulting `text`.
- Provides read-only getters (`id`, `name`, `color`, `model`, `systemPrompt`, `mafiaRole`) and `toJSON`/`fromJSON` helpers to serialize/deserialize agents if persistence is added later.

`ChatAgent` is the only place that knows about the `ai` SDK and OpenRouter client; all UI and hooks interact with it via its TypeScript interface.

### UI composition

#### Home experience (`src/pages/Home.tsx`)

- Pulls state and actions from `useChat`.
- Calculates derived UI flags:
  - `isInitial` — based on `GameState`.
  - `canStart` — requires at least two agents.
- Renders:
  - `Header` — Passes `onStart`, `disableStart`, and `disableSettings` based on `gameState` and agent count.
  - `AgentPanel` — Shows current agents, allows selecting one to respond, adding new agents, or removing existing ones.
  - `ChatMessages` — Visual list of all messages with per-agent colors.
  - `ChatInput` — Textarea for moderator messages.

#### Settings and configuration (`src/pages/Settings.tsx`)

Handles all persistent configuration via `localStorage` and the OpenRouter HTTP API:

- Storage keys:
  - `openrouter_api_key` — Bearer token for OpenRouter; used by `useChat` and written here.
  - `selected_models` — Array of `OpenRouterModel` persisted as JSON; used by `AgentForm` to populate model choices.
- API interactions:
  - `POST https://openrouter.ai/api/v1/chat/completions` — Simple test request with model `openai/gpt-3.5-turbo` to validate the API key.
  - `GET https://openrouter.ai/api/v1/models` — Fetches available models; response trimmed down to `{ id, name }`.
- Local UI state manages loading flags, test status, model search string, and the list of all and selected models.

Any changes to how API keys or model lists are stored should stay consistent with these storage keys so the rest of the app (notably `useChat` and `AgentForm`) continue to function.

#### Components (`src/components`)

- `Header` — Top navigation bar:
  - Shows logo/link to `/`.
  - Optional `Start` button controlled by `Home`.
  - Either a `Settings` link (when allowed) or a disabled label, or a back link on the Settings page.
- `AgentPanel` — Left-side panel listing agents and providing creation/removal controls:
  - Receives `ChatAgent[]` plus callbacks from `Home`/`useChat`.
  - Manages local `showForm` toggle to reveal `AgentForm`.
- `AgentForm` — Agent creation form:
  - Builds an `Omit<AgentConfig, 'id'>` for `useChat.addAgent`.
  - Reads `selected_models` from `localStorage` to populate available models; if none, shows a hint to configure Settings.
  - Randomizes default name and color.
  - Allows choosing a `MafiaRole`, system prompt, and color.
- `AgentCard` — Visual representation of a single agent:
  - Uses `MafiaRole` to choose background color and emoji.
  - Shows agent name and model, with a colored border from `agent.color`.
  - Optional remove button, guarded to avoid triggering the card click.
- `ChatMessages` / `ChatMessage` — Present the chat transcript:
  - Scrolls to bottom on new messages.
  - Colors agent messages based on the associated agent's `color` (falling back to a default gray when unknown).
  - Distinguishes system, moderator, and agent messages in layout and styling.
- `ChatInput` — Textarea and send button for moderator messages:
  - Submits on Enter (without Shift) and supports multi-line input with Shift+Enter.

### Persistence and configuration

- OpenRouter API key is stored only in `localStorage` under the key `openrouter_api_key`.
- The list of selectable models is stored under `selected_models` as a JSON array of `{ id, name }`.
- `ChatAgent` instances themselves are not persisted; they are recreated in memory on each page load.

Any future persistence (e.g., saving agents or chat history) should reuse the existing `AgentConfig` and `Message` types where possible.

## Cross-tool guidance

This repository also contains a `CLAUDE.md` file used to guide Claude Code. Its key instructions that are relevant here have been incorporated:

- Use the Yarn scripts defined in `package.json` (`start`, `build`, `test`, `serve`) for all routine development workflows.
- Treat the app as a client-only React SPA; do not assume a backend or server-side rendering in this repo.
- Respect the existing routing structure (`HashRouter`) and the localStorage-based storage of the OpenRouter API key and model selections when extending functionality.
