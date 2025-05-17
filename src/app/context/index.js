'use client'

import { ethersAdapter, projectId, networks } from '@/config'
import { createAppKit } from '@reown/appkit/react'
import React from 'react'
import {
  DefaultSIWX,
  LocalStorage,
} from "@reown/appkit-siwx";

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  title: "Digit Rabbit",
  description: "Explore the wonderful world of Digit Rabbit!",
  url: 'http://localhost:3000', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal
export const modal = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks,
  metadata,
  themeMode: 'light',
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  },
  siwx: new DefaultSIWX()
})

export function ContextProvider({ children }) {
  return (
    <>{children}</>
  )
}

export default ContextProvider