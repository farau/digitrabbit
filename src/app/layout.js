import "98.css";
import "./globals.css";
import { ContextProvider } from '@/app/context'

export const metadata = {
  title: "Digit Rabbit",
  description: "Explore the wonderful world of Digit Rabbit!",
  icons: {
    icon: 'img/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
      <ContextProvider>{children}</ContextProvider>
      </body>
    </html>
  );
}
