// Get appId from Privy.io dashboard
export const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID // replace with your actual appId
export const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || null // replace with your actual appId

if (!appId) {
  throw new Error('App ID is not defined')
}
