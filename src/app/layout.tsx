import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Philosophers — a voice-first dialogue",
  description:
    "Converse with historically grounded AI simulations of great philosophers, or stage a debate between two of them.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative min-h-screen">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
