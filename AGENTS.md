# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 15 App Router application written in strict TypeScript. Routes and server handlers live under `src/app/`; reusable React components belong in `src/components/`; domain logic, hooks, provider adapters, retrieval, and security utilities live in `src/lib/`. Keep curated RAG material in `data/rag/`, generated embeddings in `src/data/`, static images in `public/`, and operational or evaluation utilities in `scripts/`. Architecture and contributor notes are maintained in `docs/`. Tests are colocated with the code they exercise as `*.test.ts` or `*.test.tsx`.

## Build, Test, and Development Commands

- `npm ci` installs the exact dependency versions from `package-lock.json`.
- `npm run dev` starts the local development server at `http://localhost:3000`.
- `npm test` runs the Vitest suite once in the jsdom environment.
- `npm run build` regenerates embeddings through `prebuild`, then creates a production Next.js build.
- `npm run start` serves the completed production build.
- `npm run lint` runs the repository's configured Next.js lint command.
- `npm run check:security` stress-tests input validation and abuse controls; `npm run check:latency:local` checks a running local server for dead air.

Copy `.env.example` to `.env.local` before local development and supply required provider keys. Never commit `.env.local` or secrets.

## Coding Style & Naming Conventions

Use two-space indentation, double quotes, semicolons, and idiomatic React function components. Name components and their files in `PascalCase` (`VoiceVisualizer.tsx`); use `camelCase` for functions, hooks, and variables; prefix hooks with `use`; and use lowercase route segments. Prefer the `@/` alias for imports from `src/`. Keep provider-specific behavior behind the adapters in `src/lib/providers/`. TypeScript must remain strict and pass without emitted output.

## Testing Guidelines

Use Vitest and Testing Library for unit and component tests. Add focused, deterministic tests beside changed logic and cover success, failure, and boundary cases, especially for retrieval, streaming, speech chunking, and security code. There is no enforced coverage threshold; meaningful regression coverage is expected. Run `npm test` before opening a pull request.

## Commit & Pull Request Guidelines

History uses short, imperative, sentence-case subjects such as `Add project README` and `Fix carousel snap scroll`. Keep each commit scoped to one coherent change. Pull requests should explain the user-visible effect and technical approach, list validation commands, link related issues, and include screenshots or recordings for UI or voice-flow changes. Call out environment, RAG corpus, or generated-embedding changes explicitly.
