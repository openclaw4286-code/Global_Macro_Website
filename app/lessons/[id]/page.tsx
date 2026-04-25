import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_LABELS, type Lesson } from "@/schema/lesson";
import { getAllLessonIds, getLessonById } from "@/lib/lessons";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllLessonIds().map((id) => ({ id }));
}

const CATEGORY_DOT_CLASS: Record<Lesson["meta"]["category"], string> = {
  policy: "bg-category-policy",
  trade: "bg-category-trade",
  commodity: "bg-category-commodity",
  risk: "bg-category-risk",
  tech: "bg-category-tech",
};

export default function LessonPage({ params }: { params: { id: string } }) {
  const lesson = getLessonById(params.id);
  if (!lesson) notFound();

  const { meta, headline, story } = lesson;
  const paragraphs = story.body.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-body-2 text-fg-muted hover:text-link">
        ← 모든 수업
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-caption text-fg-muted">
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${CATEGORY_DOT_CLASS[meta.category]}`}
          />
          <span>{CATEGORY_LABELS[meta.category]}</span>
          <span aria-hidden>·</span>
          <span>{meta.subject.name}</span>
          <span aria-hidden>·</span>
          <time dateTime={meta.publishedAt}>{meta.publishedAt}</time>
        </div>
        <h1 className="mt-3 text-title-1 text-fg">{headline.title}</h1>
        <p className="mt-3 text-body-1 text-fg-muted">{headline.hook}</p>
      </header>

      {/* TODO(2단계): 인과 다이어그램 — chain.trigger → steps[] → outcomes[] */}
      <div className="mt-10 rounded-md border border-dashed border-line p-6 text-center text-caption text-fg-subtle">
        인과 다이어그램은 2단계에서 추가
      </div>

      <article className="mt-10 space-y-5">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-body-1 text-fg">
            {p}
          </p>
        ))}
      </article>

      <aside className="mt-10 rounded-md bg-brand-soft p-6">
        <p className="text-caption text-fg-muted">핵심 한 줄</p>
        <p className="mt-2 text-heading-1 text-fg">{story.keyTakeaway}</p>
      </aside>

      {/* TODO(2단계): 차트 — supplements.charts[] */}
      <div className="mt-10 rounded-md border border-dashed border-line p-6 text-center text-caption text-fg-subtle">
        차트는 2단계에서 추가
      </div>
    </main>
  );
}
