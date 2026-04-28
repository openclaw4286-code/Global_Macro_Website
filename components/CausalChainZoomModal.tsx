"use client";

// 다이어그램 확대 모달.
//
// react-zoom-pan-pinch로 줌·팬·핀치를 위임:
//   - 데스크톱: 마우스 휠 줌(Ctrl 불필요), 드래그 pan, +/- 버튼
//   - 모바일:   pinch zoom + drag pan (라이브러리 기본 제스처)
//
// 모달 콘텐츠는 DesktopChainSvg를 그대로 재사용 (인라인과 같은 layout 함수,
// 같은 박스/화살표). marker id 충돌을 피하려고 idSuffix='modal' 전달.
//
// 접근성:
//   role=dialog, aria-modal, aria-labelledby로 lesson 제목 참조,
//   focus trap (Tab 순환), 닫힐 때 트리거 버튼으로 focus 복귀,
//   ESC/오버레이 클릭/X 버튼 모두 닫기, +/- /0 키 줌 단축키.

import { useCallback, useEffect, useId, useRef } from "react";
import {
  TransformComponent,
  TransformWrapper,
  useControls,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { DesktopChainSvg } from "./CausalChain";
import type { Lesson } from "@/schema/lesson";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.4;

export function CausalChainZoomModal({
  lesson,
  onClose,
}: {
  lesson: Lesson;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // body 스크롤 lock — 모달 열린 동안만.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // 마운트 시 닫기 버튼으로 초기 focus.
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // 키보드 단축키: ESC 닫기, +/= 확대, -/_ 축소, 0 reset.
  // focus trap: Tab/Shift+Tab을 dialog 내부로 순환.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      const t = transformRef.current;
      if (t) {
        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          t.zoomIn(ZOOM_STEP);
          return;
        }
        if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          t.zoomOut(ZOOM_STEP);
          return;
        }
        if (e.key === "0") {
          e.preventDefault();
          t.resetTransform();
          return;
        }
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // 오버레이 클릭으로만 닫기 (이벤트 target이 dialog 내부면 무시).
  const onOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <div
      onClick={onOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-[95vh] w-screen flex-col overflow-hidden rounded-none bg-surface shadow-elev-3 sm:h-[85vh] sm:w-[90vw] sm:max-w-[1400px] sm:rounded-md"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <h2
            id={titleId}
            className="text-heading-1 text-fg"
          >
            {lesson.headline.title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="확대 보기 닫기"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-line-focus"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="relative flex-1 overflow-hidden bg-surface-sunken">
          <TransformWrapper
            ref={transformRef}
            initialScale={1}
            minScale={ZOOM_MIN}
            maxScale={ZOOM_MAX}
            wheel={{ step: 0.1, wheelDisabled: false }}
            doubleClick={{ disabled: true }}
            limitToBounds={false}
            centerOnInit
          >
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
              }}
            >
              {/* 인라인과 동일한 desktop 레이아웃을 그대로 사용 — layout/box/
                  화살표/스타일 함수 모두 공유. idSuffix만 'modal'로 분리. */}
              <div className="w-full">
                <DesktopChainSvg lesson={lesson} idSuffix="modal" />
              </div>
            </TransformComponent>
            <ZoomControls />
          </TransformWrapper>
        </div>
      </div>
    </div>
  );
}

// 줌 컨트롤. useControls는 TransformWrapper 자식 안에서만 사용 가능하므로
// 별도 컴포넌트로 분리.
function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform, centerView } = useControls();

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-1 rounded-sm border border-line bg-surface p-1 shadow-elev-2">
      <ControlButton ariaLabel="확대" onClick={() => zoomIn(ZOOM_STEP)}>
        <PlusIcon />
      </ControlButton>
      <ControlButton ariaLabel="축소" onClick={() => zoomOut(ZOOM_STEP)}>
        <MinusIcon />
      </ControlButton>
      <ControlButton ariaLabel="원래 크기" onClick={() => resetTransform()}>
        <span className="text-caption font-medium">1×</span>
      </ControlButton>
      <ControlButton ariaLabel="전체 보기" onClick={() => centerView(1)}>
        <FitIcon />
      </ControlButton>
    </div>
  );
}

function ControlButton({
  ariaLabel,
  onClick,
  children,
}: {
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-line-focus"
    >
      {children}
    </button>
  );
}

function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MinusIcon() {
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
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function FitIcon() {
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
      <polyline points="4 14 4 20 10 20" />
      <polyline points="20 10 20 4 14 4" />
      <line x1="14" y1="10" x2="20" y2="4" />
      <line x1="10" y1="20" x2="4" y2="14" />
    </svg>
  );
}
