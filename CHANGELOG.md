# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Infra / Tooling
- Upgraded to `next@16.2.1`, `eslint-config-next@16.2.1`, `@sentry/nextjs@10.46.0`, and `viem@2.46.3`.
- Updated npm scripts (`next ... .`) and switched lint script to `eslint .`.
- Added `turbopack.root` in Next config to fix workspace-root inference warnings.
- Simplified ESLint flat config import.

### Runtime / Routing
- Migrated from deprecated `middleware` convention to `proxy` (`src/proxy.js`).
- Removed legacy `src/middleware.js`.
- Removed obsolete whitelist API route (`src/app/api/whitelist/check/route.js`).

### Leaderboard
- Migrated GraphQL mapping to `playerSeasonStats_collection` schema.
- Switched to `GRAPHQL_ENDPOINT` and improved GraphQL response validation/errors.
- Reworked Privy enrichment from bulk `getUsers()` to wallet-based lookup (`getUserByWalletAddress`) with server caching.
- Added dev no-cache fetch behavior for leaderboard hook.
- Added explicit response caching headers in `/api/leaderboard` (dev vs prod behavior).

### Quests
- Added `period=all` mode to `GET /api/quests/claim` to fetch daily + weekly status in one request.
- Added `unstable_cache` for auth user lookup and NFT holdings checks.
- Optimized cooldown/status reads with multicall.
- Added lightweight quests performance logs.

### Chat
- `POST /api/chat/send`:
  - Removed unused NFT scoring path and dead code.
  - Added stricter payload validation and linked-wallet ownership check.
  - Added short auth cache (`unstable_cache`) and `Server-Timing` instrumentation.
- `GET /api/chat/stats`:
  - Added short server cache + explicit cache headers.
- `RabbitChat` UI:
  - Deduplicated in-flight stats requests.
  - Added optimistic local stats update after send.
  - Added delayed background stats refresh.

### WebSocket / Live Sync
- Added `onGamePlayed` callback registration in MainPage so game stats refresh live without full page reload.
- Added address-based filtering for gameplay/account callbacks to avoid unrelated user refreshes.
- Kept RabbitChat real-time event stream global (not filtered by user address).

### UI / UX
- Removed Wardrobe feature (component, styles, references, icon entries).
- Profile:
  - Replaced rabbit download/avatar block with Twitter profile avatar.
  - Removed `Download Rabbit` action.
  - Renamed message panel to `Messages`.
  - Added `Total` message card with compact large-number display.
  - Centered message chart vertically and horizontally.
- Footer/start menu: reorganized quick-access app order and icon rendering tweaks.
- Mobile background: updated icon positions and optional rabbit visibility.
- Updated selected copy/text in About, FAQ, and Leaderboard labels.

### Styling / Assets
- Updated background/overlay styling and z-index layering behavior.
- Removed old image assets no longer used by current UI.

### Security / Config
- Removed deprecated `GRAPHQL_METH_ENDPOINT` from `.env.local.example`.
- Updated `.gitignore` with additional generated/local data exclusions.
