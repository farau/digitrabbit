# Changelog

All notable changes to this project will be documented in this file.


## Changelog

## [12/04/2026]

Add League & Profile section league styling; refactor RabbitChat and WalletButton components; update styling and improve user experience

- Updated RabbitChat component to change "Rabbit Points" to "RabbitPoints" for consistency.
- Enhanced button styles in RabbitChat for better visibility and interaction.
- Modified WalletButton to ensure login is only enabled when Privy is ready and user is authenticated.
- Added new API route for user profile stats, including error handling and response formatting.
- Introduced a new hook for generating share cards with improved visuals and functionality.
- Created utility functions for league management, including score calculation and league cutoffs.
- Added CSS animations for improved UI transitions.

## [06/04/2026]

### Onboarding / MainPage
- Refactored onboarding logic out of `MainPage` into a dedicated hook:
  - Added `src/app/hooks/useMainPageOnboarding.js`.
  - Moved onboarding state, targeting logic, step transitions, and typed text effects into the hook.
- Expanded onboarding flow before FAQ:
  - Added explicit guidance steps to highlight where to click for `Game.exe` and `RabbitChat`.
  - FAQ now comes after these guided navigation steps.
- Reworked Settings onboarding into sequential sub-steps:
  - `Copy embedded wallet` -> `Add funds` -> `Link Wallet`.
  - Progression from copy now triggers on actual copy action (event-driven), not on `Next`.
  - Funding step no longer auto-skips; progression is controlled by onboarding rules/UI.
- Added wallet-link guidance guardrails:
  - New red warning copy clarifies users only need to link wallets that already hold NFTs.
  - Explicitly states no transfer/rebuy is needed on embedded wallet.
  - `Next` is locked until user clicks `Link Wallet` at least once.
- Added auto-scroll to reveal hidden `Link Wallet` control during onboarding when needed.
- Closed `Settings` window when leaving the funding/link part of onboarding with required conditions met.

### Settings
- Renamed CTA from `Send funds` to `Add funds`.
- Added `data-app=\"settings-link-wallet\"` to `Link Wallet` button for onboarding targeting.
- Emitted onboarding event when `Link Wallet` is clicked to unlock next step.
- Emitted onboarding event after successful embedded wallet copy action.

### Onboarding Audio / UX
- Added retro typing SFX while onboarding text is progressively rendered.
- Added step-complete SFX (`/sounds/text_complete.wav`) when clicking onboarding `Next`.

### RabbitChat / Mobile
- Fixed mobile composer behavior to avoid excessive viewport lift/zoom issues:
  - Removed keyboard-inset overcompensation behavior.
  - Switched mobile chat container sizing to stable `100dvh`.
  - Removed input focus `scrollIntoView` jump for composer.
  - Increased mobile input font size to `16px` to avoid iOS auto-zoom.
- Updated message score display behavior:
  - RabbitPoints badge/logo is now hidden for chat messages with score `0`.

### Audio / MainPage Entry
- Updated taskbar audio player to support startup autoplay and source fallback:
  - Tries `/sounds/background.mp3` on page entry.
  - Falls back to `/sounds/soundtrack.mp3` if primary source fails.
  - Added retry-on-user-interaction behavior for autoplay-restricted environments.

### Quests / Notification Center
- Simplified quest notification refresh in `MainPage` by integrating `useQuestsStatus`:
  - Replaced manual quest status fetch pipeline with hook-driven status (`period=all`).
  - Kept notification calculations (ready count / next cooldown) in `MainPage` using hook data + player progress.
  - Updated quest-related refetch triggers to call `refetchQuestStatus()`.

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
- Onboarding finish flow polish:
  - Removed desktop return translation animation on `Finish` for an immediate close/open behavior.
  - `Finish` now closes onboarding immediately and opens `FAQ` directly.
- 3D rabbit head stability fixes:
  - Prevented duplicate rabbit head display during onboarding by hiding the base desktop head icon while onboarding overlay head is active.
  - Forced onboarding rabbit head to always use the light model (`head`) for visual consistency.
  - Fixed disappearing head after onboarding/FAQ open by cloning GLTF scenes per instance (prevents shared-scene mount/unmount conflicts).

### MainPage / Notification Center
- Added compact Notification Center with live status:
  - Quests readiness / next quest timer.
  - Game cooldown timer.
  - Chat unread count.
- Updated game cooldown source:
  - Notification Center now reads `COOLDOWN()` directly from the smart contract.
  - Falls back to local `COOLDOWN_SECONDS` only if on-chain read fails.
- Replaced `Q/G/C` labels with corresponding icons.
- Unread chat display capped to:
  - `+10 messages unread` when unread count is greater than 10.
- Updated positioning and layering:
  - Moved to bottom-right, above footer.
  - Kept above `overlay.png` and below main app windows.

### Profile / Rendering Performance
- Fixed unnecessary `Profile` re-renders when unrelated `MainPage` UI state updates occur (click/focus/timers/notifications).
- Wrapped `Profile` with `React.memo` and a custom player-data comparator so stats UI re-renders only when profile-relevant data actually changes.

### RabbitBot / Security
- Added double proxy Redis guard for RabbitBot flow:
  - `POST /api/chat/send` (when `sendToRabbitBot=true`) applies RabbitBot rate-limit before any on-chain send.
  - `POST /api/chat/bot` applies the same RabbitBot rate-limit as a second guard.
- RabbitBot rate-limit identifier now uses validated `walletAddress` only.
- Added strict payload validation in proxy for RabbitBot-related calls:
  - Requests fail fast if `userAddress` is missing/invalid.
- Hardened `POST /api/chat/bot` with on-chain reply-target validation:
  - Verifies `replyToMessageId` points to an on-chain message sent by the authenticated wallet.
  - Verifies reply-target freshness (recent message window).

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
- Updated LLM behavior:
  - RabbitBot `systemPrompt` now enforces English-only responses.
- Added target address input improvements in `RabbitChat`:
  - Clear button and reset controls simplify recipient selection and message targeting.

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

### Linktree / Mobile UX
- Added `Linktree` window for external link sharing and resource access.
- Improved mobile chat composer visibility so text input remains accessible during keyboard interaction.
- Updated chat/game/leaderboard/quests UX flows for better stability and consistency.
- Updated `public/img/icons/link.png` asset for improved visuals.

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

## [29/03/2026]

### Framework / Performance
- Upgraded to Next.js 16 and improved cache/API optimization.
- Renamed `src/middleware.js` to `src/proxy.js` and centralized shared WebSocket/chain configuration in `src/utils/chainConfig.js`.
- Removed legacy `Wardrobe` component and assets as part of interface simplification.

### Assets
- Compressed and updated image assets for `light`, `night`, and `overlay` themes to reduce bundle size.
- Normalized overlay asset filenames for production compatibility and removed outdated files.

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
