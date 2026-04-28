"use client";

// 다이어그램 확대 버튼.
// 모달 코드(react-zoom-pan-pinch 포함)는 next/dynamic + ssr:false로
// 클릭 후에만 다운로드되도록 분리 — lesson 페이지 초기 번들 영향 최소화.
// 홈 / lesson 목록은 이 버튼 자체를 렌더하지 않으므로 영향 없음.

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import type { Lesson } from "@/schema/lesson";

const CausalChainZoomModal = dynamic(
  () =>
    import("./CausalChainZoomModal").then((m) => m.CausalChainZoomModal),
  { ssr: false }
);

export function CausalChainZoomButton({ lesson }: { lesson: Lesson }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    // 모달 닫힐 때 트리거 버튼으로 focus 복귀 (a11y).
    buttonRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="다이어그램 확대해서 보기"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-line text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-line-focus"
      >
        <Maximize2Icon />
      </button>
      {open ? (
        <CausalChainZoomModal lesson={lesson} onClose={handleClose} />
      ) : null}
    </>
  );
}

function Maximize2Icon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}
