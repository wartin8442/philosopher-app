"use client";

import { useEffect } from "react";
import { rememberLastPhilosopher } from "@/lib/lastPhilosopher";

/**
 * Invisible helper for server-rendered pages: records the philosopher being
 * viewed so the landing-page carousel re-centers on them when the user
 * navigates back out.
 */
export default function RememberVisit({ id }: { id: string }) {
  useEffect(() => {
    rememberLastPhilosopher(id);
  }, [id]);
  return null;
}
