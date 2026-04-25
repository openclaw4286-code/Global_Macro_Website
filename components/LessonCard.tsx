import Link from "next/link";
import { CATEGORY_LABELS, type Lesson } from "@/schema/lesson";

const CATEGORY_DOT_CLASS: Record<Lesson["meta"]["category"], string> = {
  policy: "bg-category-policy",
  trade: "bg-category-trade",
  commodity: "bg-category-commodity",
  risk: "bg-category-risk",
  tech: "bg-category-tech",
};

export function LessonCard({ lesson }: { lesson: Lesson }) {
  const { id, meta, headline } = lesson;
  return (
    <Link
      href={`/lessons/${id}`}
      className="group flex flex-col rounded-md border border-line bg-surface p-6 shadow-elev-1 transition hover:border-line-strong hover:shadow-elev-2"
    >
      <div className="flex items-center gap-2 text-caption text-fg-muted">
        <span
          aria-hidden
          className={`h-2 w-2 rounded-full ${CATEGORY_DOT_CLASS[meta.category]}`}
        />
        <span>{CATEGORY_LABELS[meta.category]}</span>
        <span aria-hidden>·</span>
        <span>{meta.subject.name}</span>
      </div>
      <h2 className="mt-3 text-title-2 text-fg group-hover:text-link">
        {headline.title}
      </h2>
      <p className="mt-2 text-body-2 text-fg-muted">{headline.hook}</p>
    </Link>
  );
}
