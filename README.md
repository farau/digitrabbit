
# Digit Rabbits

This repository contains the Digit Rabbits website — a Next.js application showcasing the Digit Rabbits project. The site provides an interactive front-end for the collection, including a game built on MegaETH network, a shop, a profile section, a leaderboard and a wallet integration powered by Privy.

## What you'll find here

- A modern Next.js 15 app using the App Router (`app/`).
- Interactive 3D and visual components under `src/app/components/` (Three.js + react-three-fiber).
- Wallet and authentication integrations (`@privy-io`, `wagmi`, `ethers`, `viem`).
- API routes for assets, memes, leaderboard, and wallet validation in `src/app/api/`.
- Utilities and libs for blockchain interactions in `src/lib` and `src/utils`.

## Features

- Home / Landing page with animated visuals and effects.
- Profile pages showing your avatar and blockchain statistics.
- An addictive clicker game to showcase speed of the MegaETH network.
- Shop for customizing your Digital rabbit (images & assets under `public/img/shop`).
- Leaderboard and community features backed by on-chain data and The Graph.
- Auth and wallet-based flows for claiming and interacting with the shop and the game.

## Development

Requirements:

- Node.js (recommended 18+)
- pnpm, npm or yarn

Install dependencies and run locally:

```bash
pnpm install
pnpm dev
```

Or with npm:

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the site.

Important NPM scripts (from `package.json`):

- `dev` - development server (uses Turbopack)
- `build` - production build
- `start` - start built app
- `lint` - run ESLint

## Environment

This app uses environment variables stored in `.env.local`. A sample file is provided as `.env.local.example` in the project root. It contains the variable names used by the application; copy it and fill values for your environment:

```bash
cp .env.local.example .env.local
# then edit .env.local and fill in values
```

Example variables used in the project include:

- `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_PRIVY_CLIENT_ID` - Privy auth config
- `PRIVY_APP_SECRET` - Privy secret (server-only)
- `NEXT_PUBLIC_DIGIT_RABBITS_ADDRESS` - contract address for on-chain data
- `GRAPHQL_ENDPOINT` - The Graph/Goldsky endpoint for indexing/queries
- `GRAPHQL_AUTH_TOKEN` - Bearer token for private GraphQL endpoints such as Goldsky
- RabbitBot backend vars:
  - `RABBITBOT_ENABLED`
  - `RABBITBOT_PRIVATE_KEY`
  - `RABBITBOT_DAILY_IP_LIMIT`
  - `RABBITBOT_AWARD_ENABLED`
- Sentry and other monitoring keys

Do not commit secrets. Keep `.env.local` out of version control.

## Project Structure (high level)

- `src/app` - Next.js app routes and components
- `src/app/components` - UI components (game, shop, profile, etc.)
- `src/app/api` - API routes used by the front-end
- `src/lib` - blockchain and backend helpers
- `public` - static assets, 3D models and images


## License

This repository does not include a license file. 
