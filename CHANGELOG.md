# Changelog

All notable changes to this project will be documented in this file.


## Changelog

## [31/03/2026]

feat: enhance chat moderation features and user experience
- Added isMuted and muteExpiresAt fields to user stats in chat API.
- Conditional rendering of game message based on playerData.hasClaimedPoints.
- Improved touch and mouse event handling in MobileBackground component.
- Introduced duration options for mute actions in RabbitChat moderation modal.
- Enhanced error handling and notifications for moderation actions.
- Implemented WebSocket for chat moderation events, including user mute notifications.
- Refactored moderation target validation and user feedback mechanisms.

## [30/03/2026]

### Mobile / Viewport
- Fixed unwanted page micro-scroll on mobile:
  - Added global `html, body` guards (`margin: 0`, full-size, `overscroll-behavior: none`).
  - Switched fullscreen containers to `100dvh` (with `100vh` fallback) for better dynamic browser UI handling.
  - Enforced hidden overflow on main desktop/mobile background wrappers.

### Windows / UX
- Improved `DraggableWindow` behavior on mobile so newly opened windows stay fully visible:
  - Added dynamic top inset handling from `visualViewport.offsetTop`.
  - Constrained window Y position with mobile top-safe bounds.
  - Added safe-area aware mobile max-height in window CSS.
- Restored classic OS-like cascade offset between multiple open windows.
- Passed explicit window ordering metadata from `MainPage` to `DraggableWindow` (`windowIndex`, `totalWindows`) for deterministic stacking offsets.

### React / Lint Fixes
- Removed synchronous `setState` initialization pattern for screen size in effect:
  - `screenSize` now uses lazy `useState` initialization.
- Removed effect-driven animation state sync that could trigger cascading render warnings.
- Deferred effect-driven window recenter/reclamp updates with `requestAnimationFrame` cleanup where needed.
- Stabilized effect dependency usage around resize/reposition logic.

### Game / Cooldown
- Switched game cooldown source from local constant-only behavior to on-chain contract value:
  - Added `COOLDOWN()` getter to `DIGIT_RABBITS_ABI`.
  - `Game` now reads cooldown from contract and falls back to `COOLDOWN_SECONDS` if RPC read fails.
- Improved Start Game UX responsiveness:
  - Added immediate "transaction submitted / confirming" state after `txHash` is returned.
  - Kept timer start strictly after `waitForTransactionReceipt` confirmation.
  - Exposed pending start tx hash in UI while waiting for receipt.

### WebSocket / Live Sync
- Added `GameStarted` callback support in `WebSocketProvider`.
- Registered `onGameStarted` in `MainPage` to refresh player data as soon as game starts.
- Cooldown UI now updates at `GameStarted` event time (no need to wait for first `GamePlayed`).

### Social / Navigation
- Added a new `Linktree` app window with a Linktree-like layout and official social links:
  - OpenSea collection link
  - Discord link
  - Twitter/X link
- Integrated `Linktree` entry points across the UI:
  - Desktop icon (`MainPage`)
  - Start menu item (`Footer`)
  - Mobile floating icon (`MobileBackground`)

### Chat / Mobile UX
- Improved RabbitChat composer behavior on mobile keyboard open:
  - Added `visualViewport`-based keyboard inset handling.
  - Kept input area sticky and visible with safe-area support.
  - Added input focus auto-scroll to keep composer in view.
- Updated message composer layout on mobile:
  - `Send` button is now full-width under the input field.

### Quests API
- Fixed wallet normalization in `POST /api/quests/claim` to prevent `address.toLowerCase is not a function`:
  - Added robust address normalization helper for mixed wallet shapes.
  - Normalized holdings cache key generation and NFT balance checks.
  - Mapped linked accounts to plain wallet address strings before validation.

### Leaderboard
- Reworked initial-load timeout handling to satisfy React lint/runtime constraints:
  - Removed ref reads during render for timeout state.
  - Avoided synchronous effect state updates by using async timeout-based state transitions.
  - Kept timeout UI reset behavior consistent on refresh/retry.

### Game / UX
- Added clear UI requirement banner in `Game`:
  - “You must own at least 1 Digit Rabbits NFT to play.”
- Improved start-authorization error handling:
  - Explicit user-facing message when backend returns `NFT_NOT_FOUND`.

### Fixes
- Fixed missing overlay background on Vercel/Linux by normalizing asset filename case:
  - Renamed `public/img/overlay.PNG` -> `public/img/overlay.png`.
- Kept CSS references unchanged (`/img/overlay.png`), now matching the actual tracked file name.

### Context
- Root cause: macOS local dev tolerated filename case mismatch, while Vercel (Linux) is case-sensitive, causing `overlay.png` to return 404.


## [29/03/2026]

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
