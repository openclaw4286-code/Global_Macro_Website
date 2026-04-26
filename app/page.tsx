import { LessonCard } from "@/components/LessonCard";
import { WorldMap } from "@/components/WorldMap";
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

      {/* 지도: lg(1024px+)에서만 표시. sm·md에서는 핀 간격이 너무 가까워
          클릭이 어렵기 때문에 숨김. 카드 리스트가 모바일의 주요 진입점. */}
      <div className="mb-12 hidden lg:block">
        <WorldMap lessons={lessons} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </section>
    </main>
  );
}
