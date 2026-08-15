import type { Metadata } from "next";
import { Suspense } from "react";
import RouteProgress from "@/components/RouteProgress";
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
    // data-scroll-behavior tells Next the page opts into CSS smooth
    // scrolling, so the router suspends it for the scroll-to-top on
    // navigation instead of animating a long slide up a tall page.
    <html lang="en" data-scroll-behavior="smooth">
      {/* The floor is the *visible* viewport, not the tall one: on a phone,
          100vh is the viewport with the browser's toolbars hidden, so a screen
          built to fit the window (the lesson, the conversation) left the page
          itself scrollable by exactly the height of the toolbar — a scroll
          into nothing below the interface. */}
      <body className="relative min-h-dvh">
        {/* useSearchParams inside RouteProgress needs a Suspense boundary
            during prerender; it renders nothing until a navigation starts. */}
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
