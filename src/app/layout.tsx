import type { Metadata } from "next";
import { Orbitron, Chakra_Petch } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["800", "900"],
  variable: "--font-orbitron",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-chakra-petch",
});

export const metadata: Metadata = {
  title: "WIKWAR",
  description: "Wikrama War — 2D browser fighting game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${orbitron.variable} ${chakraPetch.variable} font-sans bg-bg-base text-text-main antialiased overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}