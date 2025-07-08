import "98.css";
import "./globals.css";
import { ContextProvider } from '@/context'
import LeaderboardProvider from '@/app/components/LeaderboardProvider';

export const metadata = {
  title: "Digit Rabbits",
  description: "Explore the wonderful world of Digit Rabbits!",
  icons: {
    icon: 'img/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
