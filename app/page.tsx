import { LessonCard } from "@/components/LessonCard";
import { getAllLessons } from "@/lib/lessons";

export default function Home() {
  const lessons = getAllLessons();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-display text-fg">macromap</h1>
        <p className="mt-3 text-body-1 text-fg-muted">
          매크로경제 사건이 어떻게 시장과 일상으로 번지는지 따라가는 수업.
        </p>
      </header>

      {/* TODO(2단계): 지도(전 세계 핀) 자리 — 카드 리스트 위에 들어갈 예정 */}

      <section className="grid gap-4 sm:grid-cols-2">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </section>
    </main>
  );
}
