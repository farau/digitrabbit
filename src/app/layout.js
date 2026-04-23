import "./styles/98-scoped.css";
import "./globals.css";
import { ContextProvider } from '@/context'
import { Analytics } from "@vercel/analytics/next"

export const metadata = {
  title: "Digit Rabbits",
  description: "Explore the wonderful world of Digit Rabbits!",
  icons: {
    icon: "/favicon.ico",
    apple: "/img/icon-apple.png", // iOS-specific icon
    shortcut: "/img/icon-192x192.png", // autre option pour certains navigateurs
  },
  manifest: "/manifest.json", // Link to your PWA manifest
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <div className="app-shell">
          <ContextProvider>
            {children}
            <Analytics />
          </ContextProvider>
        </div>
      </body>
    </html>
  );
}
