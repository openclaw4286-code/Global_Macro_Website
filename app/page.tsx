export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-display text-fg">macromap</h1>
      <p className="text-body-1 text-fg-muted mt-3">
        매크로경제 학습 사이트 — 1단계 스켈레톤
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-line bg-surface p-6 shadow-elev-1">
          <p className="text-heading-1 text-fg">surface 카드</p>
          <p className="text-body-2 text-fg-muted mt-2">
            토큰이 작동하면 흰색 배경, 옅은 보더, 그림자가 보입니다.
          </p>
        </div>
        <div className="rounded-md border border-line bg-surface-sunken p-6">
          <p className="text-heading-1 text-fg">surface-sunken</p>
          <p className="text-body-2 text-fg-subtle mt-2">grey-100 톤</p>
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-3">
        <span className="rounded-full bg-category-policy px-3 py-1 text-caption text-fg-inverted">policy</span>
        <span className="rounded-full bg-category-trade px-3 py-1 text-caption text-fg-inverted">trade</span>
        <span className="rounded-full bg-category-commodity px-3 py-1 text-caption text-fg-inverted">commodity</span>
        <span className="rounded-full bg-category-risk px-3 py-1 text-caption text-fg-inverted">risk</span>
        <span className="rounded-full bg-category-tech px-3 py-1 text-caption text-fg-inverted">tech</span>
      </section>
    </main>
  );
}
