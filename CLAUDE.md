# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `yarn start` - dev server at localhost:3000
- `yarn build` - production build to `build/`
- `yarn test` - run tests in watch mode
- `yarn serve` - build and serve production locally

## Architecture

Client-only React SPA using Create React App with TypeScript. Uses HashRouter for routing (URLs use `#` fragments).

**Structure:**
- `src/components/` - reusable components (Header)
- `src/pages/` - route pages (Home, Settings)
- `src/App.tsx` - root component with HashRouter and routes

**Storage:**
- OpenRouter API key stored in localStorage under `openrouter_api_key`
