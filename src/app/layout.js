import { Geist, Geist_Mono } from "next/font/google";
import "98.css";
import "./globals.css";
import ContextProvider from '@/app/context'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Digit Rabbit",
  description: "Explore the wonderful world of Digit Rabbit!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <ContextProvider>{children}</ContextProvider>
      </body>
    </html>
  );
}
