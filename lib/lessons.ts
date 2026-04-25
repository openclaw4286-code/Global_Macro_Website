import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LessonSchema, type Lesson } from "@/schema/lesson";

const LESSONS_DIR = join(process.cwd(), "lessons");

let cache: Lesson[] | null = null;

function loadAllLessons(): Lesson[] {
  if (cache) return cache;
  const files = readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".json"));
  const lessons = files.map((file) => {
    const raw = JSON.parse(readFileSync(join(LESSONS_DIR, file), "utf-8"));
    return LessonSchema.parse(raw);
  });
  lessons.sort((a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt));
  cache = lessons;
  return cache;
}

export function getAllLessons(): Lesson[] {
  return loadAllLessons();
}

export function getLessonById(id: string): Lesson | undefined {
  return loadAllLessons().find((l) => l.id === id);
}

export function getAllLessonIds(): string[] {
  return loadAllLessons().map((l) => l.id);
}
