# Changelog

All notable changes to this project will be documented in this file.


## Changelog

## [04/04/2026]

### MainPage / Onboarding
- Added a full onboarding overlay flow for new players:
  - 3 guided steps (`Game`, `RabbitChat`, `FAQ`) with progressive typing effect.
  - Focus mode with darkened background and spotlight around the targeted icon.
  - Comic-style dialogue bubble UI on desktop.
- Desktop onboarding enhancements:
  - Added floating 3D rabbit head guide (positioned and tuned to avoid hiding icons).
  - `Finish` now auto-opens `FAQ`.
- Mobile onboarding enhancements:
  - No floating 3D rabbit head in mobile mode.
  - Same guided flow with `Next` / `Finish` buttons (no required app opening).
  - Pointer tip alignment tuned per step (including FAQ/Game positioning).
  - `Finish` auto-opens `FAQ`.
- Onboarding visibility rule restored:
  - Onboarding now displays only for users with zero RabbitPoints (`rabbitPoints <= 0`) after player data is loaded.
  - Removed temporary forced-test onboarding behavior.

### MainPage / Notification Center
- Added compact Notification Center with live status:
  - Quests readiness / next quest timer.
  - Game cooldown timer.
  - Chat unread count.
- Replaced `Q/G/C` labels with corresponding icons.
- Unread chat display capped to:
  - `+10 messages unread` when unread count is greater than 10.
- Updated positioning and layering:
  - Moved to bottom-right, above footer.
  - Kept above `overlay.png` and below main app windows.

### Quests / Chat Notification Reliability
- Improved quest notification refresh flow:
  - Waits for player data load before evaluating claimable quests.
  - Prevents false “no quest available” state during initial sync.
- Added chat unread tracking behavior:
  - Increments when new messages arrive and chat is closed.
  - Resets unread count when RabbitChat is opened.

### RabbitBot / Chat UX
- Expanded onboarding messaging to include RabbitBot context in Step 2:
  - Clarifies RabbitChat purpose and RabbitBot presence for new users.
  - Mentions leaderboard visibility through the `Leaderboard` tab.
- Improved first-time user guidance around chat activity:
  - Onboarding now frames chat interactions as part of the point-earning flow.

### Mobile Background
- Added `data-app` attributes on mobile floating icons to support onboarding targeting logic.

## [01/04/2026]

### Chat / RabbitBot
- Fixed Vercel/Linux asset case issue for default chat avatar:
  - Renamed tracked file `public/img/default-avatar.JPG` -> `public/img/default-avatar.jpg`.
- Fixed reply crash on system messages (`Cannot convert system-muted-... to a BigInt`):
  - Added safe `replyToMessageId` conversion (numeric-only to `BigInt`, fallback to `0n`).
  - Prevented on-chain reply flow for non-numeric/system message IDs.
- Updated RabbitBot/system message UI:
  - Removed address display for system messages.
  - Removed RabbitPoints icon + RB score for system messages.
  - Removed Reply button for RabbitBot/system messages.

### Chat / Footer Live Refresh
- Improved RabbitChat footer refresh behavior (`Role`, `Messages`, `RabbitPoints`):
  - Added `onChatStatsRefresh` callback channel in `WebSocketProvider`.
  - Triggered footer stats refresh from provider on:
    - app visibility return / window focus
    - moderation/role events (`UserMuted`, `RoleChanged`) relevant to chat stats.
  - Kept a lightweight fallback polling in `RabbitChat`, updated from 30s to 2 minutes.

### Chat / RabbitBot Conversational Flow
- Added a dedicated RabbitBot conversation mode in `RabbitChat`:
  - New composer toggle button (`RabbitBot ON/OFF`) to explicitly send a message to bot flow.
  - Bot mode now calls `POST /api/chat/bot` after user message send success.
  - Added user feedback for RabbitBot thinking state and rate-limit/backend failures.
- Added new backend endpoint `POST /api/chat/bot`:
  - Auth + wallet ownership checks using Privy identity token.
  - Added game-activity prerequisite check (`getPlayerCurrentSeasonData`) before bot usage.
  - Daily IP rate-limit (`25/day` default, configurable via env).
  - RabbitBot response generation and on-chain chat reply via backend bot wallet.
  - Optional points award transaction wiring (`awardPoints`) behind feature flag.
- Added backend utilities:
  - `src/lib/rabbitBot.js` for response/reward heuristics.
  - `src/lib/dailyIpRateLimit.js` for daily IP quota tracking.
  - Extended `src/lib/walletBackend.js` with RabbitBot wallet + on-chain send/award helpers.
- Extended `DIGIT_RABBITS_CHAT_ABI` with RabbitBot management hooks:
  - `setBotSigner(...)`
  - `awardPoints(...)`
  - `BotSignerUpdated` event
- Added RabbitBot env configuration keys in `.env.local.example`.

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
