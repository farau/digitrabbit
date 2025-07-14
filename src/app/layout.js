import "98.css";
import "./globals.css";
import { ContextProvider } from '@/context'
import LeaderboardProvider from '@/context/LeaderboardProvider';

export const metadata = {
  title: "Digit Rabbits",
  description: "Explore the wonderful world of Digit Rabbits!",
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`antialiased`}>
        <ContextProvider>
          <LeaderboardProvider>
            {children}
          </LeaderboardProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
