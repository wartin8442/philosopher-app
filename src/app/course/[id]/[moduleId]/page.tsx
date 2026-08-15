import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseLesson from "./CourseLesson";
import {
  COURSE_PHILOSOPHER_IDS,
  getCourse,
  getCourseModule,
  moduleNumber,
} from "@/lib/courses";
import { getDemoPhilosopher } from "@/lib/philosophers";
import { toPhilosopherDisplay } from "@/lib/philosopherDisplay";

/**
 * Server half of the lesson route, for the same reason the conversation route
 * has one: `lib/philosophers.ts` carries every curated system prompt, and a
 * `"use client"` page that imports it ships all of them to the browser. The
 * course script is different — it is written to be read, and goes over whole.
 *
 * Everything interactive lives in ./CourseLesson.tsx.
 */

interface PageProps {
  params: Promise<{ id: string; moduleId: string }>;
}

export function generateStaticParams() {
  return [...COURSE_PHILOSOPHER_IDS].flatMap((id) =>
    (getCourse(id)?.modules ?? []).map((module) => ({ id, moduleId: module.id })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, moduleId } = await params;
  const course = getCourse(id);
  const module = getCourseModule(id, moduleId);
  if (!course || !module) return { title: "Unknown lesson" };
  return {
    title: `${module.title} — a course on ${course.title}`,
    description: module.blurb,
  };
}

export default async function CourseLessonPage({ params }: PageProps) {
  const { id, moduleId } = await params;
  const course = getCourse(id);
  const module = getCourseModule(id, moduleId);
  const philosopher = getDemoPhilosopher(id);
  if (!course || !module || !philosopher) notFound();

  return (
    <CourseLesson
      philosopher={toPhilosopherDisplay(philosopher)}
      module={module}
      number={moduleNumber(course, moduleId)}
    />
  );
}
