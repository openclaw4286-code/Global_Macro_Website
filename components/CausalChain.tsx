import {
  CATEGORY_LABELS,
  IMPACT_COLORS,
  IMPACT_LABELS,
  type CausalChain as CausalChainType,
  type ChainNode,
  type Lesson,
  type Outcome,
} from "@/schema/lesson";

// ─── 레이아웃 상수 ───────────────────────────────────────
const TEXT_FS = 13;       // text-label
const TEXT_LH = 18;
const SUB_FS = 12;        // text-caption
const SUB_LH = 16;
const PAD_X = 16;
const PAD_Y = 12;
const TEXT_SUB_GAP = 4;
const MAX_LINES = 2;

const MIN_BOX_W = 100;
const MAX_BOX_W = 240;
const COL_GAP = 56;       // 컬럼 간격 (화살표 공간)
const OUTCOME_GAP = 12;   // outcome 박스 세로 간격

// ─── 문자폭 휴리스틱 (서버 사이드, DOM 측정 없이) ─────
function charWidth(ch: string, fontSize: number): number {
  // 한글·한자
  if (/[ㄱ-힝一-鿿　-〿]/.test(ch)) return fontSize * 1.0;
  if (/\s/.test(ch)) return fontSize * 0.3;
  if (/[A-Za-z]/.test(ch)) return fontSize * 0.55;
  if (/[0-9]/.test(ch)) return fontSize * 0.6;
  return fontSize * 0.5;
}

function measure(text: string, fontSize: number): number {
  let w = 0;
  for (const ch of text) w += charWidth(ch, fontSize);
  return w;
}

// 2줄까지만 허용. 3줄 이상이면 마지막 줄 끝 ellipsis.
function wrapLines(text: string, fontSize: number, maxWidth: number): string[] {
  if (measure(text, fontSize) <= maxWidth) return [text];

  // 단어(공백 포함) 단위 분할. 한국어는 공백이 적어 단어 단위로 안 나뉘면
  // 글자 단위 fallback.
  const tokens = text.match(/\S+\s*|\s+/g) ?? [text];
  const lines: string[] = [];
  let cur = "";
  for (const tok of tokens) {
    const candidate = cur + tok;
    if (measure(candidate, fontSize) <= maxWidth) {
      cur = candidate;
    } else {
      if (cur) lines.push(cur.trimEnd());
      // 토큰 자체가 maxWidth보다 크면 글자 단위로 끊기
      if (measure(tok, fontSize) > maxWidth) {
        let buf = "";
        for (const ch of tok) {
          if (measure(buf + ch, fontSize) > maxWidth) {
            lines.push(buf);
            buf = ch;
          } else {
            buf += ch;
          }
        }
        cur = buf;
      } else {
        cur = tok;
      }
      if (lines.length >= MAX_LINES) break;
    }
  }
  if (cur && lines.length < MAX_LINES) lines.push(cur.trimEnd());

  if (lines.length > MAX_LINES) {
    lines.length = MAX_LINES;
  }

  // 잘렸다면 ellipsis
  if (measure(lines.join(""), fontSize) < measure(text, fontSize)) {
    const last = lines[MAX_LINES - 1] ?? "";
    let truncated = last;
    while (measure(truncated + "…", fontSize) > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    lines[MAX_LINES - 1] = truncated + "…";
  }

  return lines;
}

// ─── 박스 측정 ───────────────────────────────────────────
type BoxLayout = {
  textLines: string[];
  subLines: string[];
  width: number;
  height: number;
};

function layoutBox(node: ChainNode): BoxLayout {
  const innerMax = MAX_BOX_W - PAD_X * 2;
  const textLines = wrapLines(node.text, TEXT_FS, innerMax);
  const subLines = wrapLines(node.sub, SUB_FS, innerMax);

  const widest = Math.max(
    ...textLines.map((l) => measure(l, TEXT_FS)),
    ...subLines.map((l) => measure(l, SUB_FS))
  );
  const width = Math.min(MAX_BOX_W, Math.max(MIN_BOX_W, Math.ceil(widest) + PAD_X * 2));
  const height =
    PAD_Y +
    textLines.length * TEXT_LH +
    TEXT_SUB_GAP +
    subLines.length * SUB_LH +
    PAD_Y;

  return { textLines, subLines, width, height };
}

// ─── 색 매핑 ─────────────────────────────────────────────
// trigger·steps는 중립 회색. outcomes만 impact별 색.
type BoxStyle = {
  fill: string;
  stroke: string;
  textColor: string;
  subColor: string;
  strokeWidth: number;
};

function neutralStyle(): BoxStyle {
  return {
    fill: "var(--surface-sunken)",
    stroke: "var(--border-strong)",
    textColor: "var(--text-primary)",
    subColor: "var(--text-secondary)",
    strokeWidth: 1,
  };
}

function outcomeStyle(impact: Outcome["impact"]): BoxStyle {
  // neutral은 trigger/steps와 동일한 회색 박스.
  if (impact === "neutral") return neutralStyle();
  // positive/negative: stroke만 IMPACT_COLORS의 hex로 강조.
  // 텍스트는 가독성 우선으로 var(--text-primary) — stroke 색 hex는
  // 흰 배경 대비 WCAG AA 본문 기준(4.5:1)을 만족하지 못함.
  // 색 정체성은 stroke가, 가독성은 텍스트가 담당하도록 역할 분리.
  return {
    fill: "var(--surface)",
    stroke: IMPACT_COLORS[impact],
    textColor: "var(--text-primary)",
    subColor: "var(--text-secondary)",
    strokeWidth: 1,
  };
}

// ─── 단일 박스 SVG ───────────────────────────────────────
function Box({
  x,
  y,
  layout,
  style,
}: {
  x: number;
  y: number;
  layout: BoxLayout;
  style: BoxStyle;
}) {
  const { width, height, textLines, subLines } = layout;
  const textBlockY = y + PAD_Y + TEXT_FS; // baseline of first text line
  const subBlockY =
    y + PAD_Y + textLines.length * TEXT_LH + TEXT_SUB_GAP + SUB_FS;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
      />
      <text
        x={x + width / 2}
        y={textBlockY}
        textAnchor="middle"
        fontSize={TEXT_FS}
        fontWeight={500}
        fill={style.textColor}
      >
        {textLines.map((line, i) => (
          <tspan key={i} x={x + width / 2} dy={i === 0 ? 0 : TEXT_LH}>
            {line}
          </tspan>
        ))}
      </text>
      <text
        x={x + width / 2}
        y={subBlockY}
        textAnchor="middle"
        fontSize={SUB_FS}
        fontWeight={400}
        fill={style.subColor}
      >
        {subLines.map((line, i) => (
          <tspan key={i} x={x + width / 2} dy={i === 0 ? 0 : SUB_LH}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

// ─── 데스크톱 레이아웃 계산 ─────────────────────────────
type Placement = { layout: BoxLayout; x: number; y: number };

function layoutDesktop(chain: CausalChainType) {
  const triggerL = layoutBox(chain.trigger);
  const stepLs = chain.steps.map(layoutBox);
  const outcomeLs = chain.outcomes.map(layoutBox);

  // outcomes 컬럼 폭은 가장 넓은 outcome에 맞춤 (정렬 일관성).
  const outcomeColW = Math.max(...outcomeLs.map((l) => l.width));
  const outcomesTotalH =
    outcomeLs.reduce((s, l) => s + l.height, 0) +
    OUTCOME_GAP * (outcomeLs.length - 1);

  // trigger·steps 컬럼들도 컬럼 내에서 폭 통일 (현재는 박스 1개씩이라 자기 폭 그대로).
  const columns: number[] = [triggerL.width, ...stepLs.map((l) => l.width), outcomeColW];

  // x 위치 누적
  const xs: number[] = [];
  let cursor = 0;
  for (const w of columns) {
    xs.push(cursor);
    cursor += w + COL_GAP;
  }
  const totalW = cursor - COL_GAP;

  // 세로 중심선 = outcomes 컬럼 높이 기준 (가장 높음)
  const totalH = Math.max(triggerL.height, ...stepLs.map((l) => l.height), outcomesTotalH);

  // trigger·steps는 totalH 정중앙 정렬
  const triggerY = (totalH - triggerL.height) / 2;
  const stepYs = stepLs.map((l) => (totalH - l.height) / 2);

  // outcomes는 위에서부터 쌓음
  const outcomeYs: number[] = [];
  {
    const startY = (totalH - outcomesTotalH) / 2;
    let y = startY;
    for (const l of outcomeLs) {
      outcomeYs.push(y);
      y += l.height + OUTCOME_GAP;
    }
  }

  // outcomes는 컬럼 폭(outcomeColW) 안에서 가운데 정렬 (각 박스 폭이 다를 수 있음)
  const outcomesX = xs[xs.length - 1];

  const triggerPlacement: Placement = { layout: triggerL, x: xs[0], y: triggerY };
  const stepPlacements: Placement[] = stepLs.map((l, i) => ({
    layout: l,
    x: xs[1 + i],
    y: stepYs[i],
  }));
  const outcomePlacements: Placement[] = outcomeLs.map((l, i) => ({
    layout: l,
    x: outcomesX + (outcomeColW - l.width) / 2,
    y: outcomeYs[i],
  }));

  return {
    width: totalW,
    height: totalH,
    trigger: triggerPlacement,
    steps: stepPlacements,
    outcomes: outcomePlacements,
  };
}

// ─── 접근성: 텍스트 흐름 요약 ────────────────────────────
function accessibleDescription(chain: CausalChainType): string {
  const parts: string[] = [];
  parts.push(`트리거: ${chain.trigger.text}`);
  chain.steps.forEach((s, i) => {
    parts.push(`${i + 1}차: ${s.text}`);
  });
  const oTexts = chain.outcomes.map(
    (o) => `${o.text}(${IMPACT_LABELS[o.impact]})`
  );
  parts.push(`결과: ${oTexts.join(", ")}`);
  return parts.join(". ") + ".";
}

// ─── 메인 컴포넌트 ───────────────────────────────────────
// 주의: SVG의 <title>/<desc>를 사용하지 않습니다. React 18/Next 14가
// body 안의 <title>을 document <title>로 hoisting 시도하는 quirk 때문에
// SSR HTML에서 본문이 비어버립니다. aria-label로 통합 (AT 호환 동등).
export function CausalChain({ lesson }: { lesson: Lesson }) {
  const { chain, headline, meta } = lesson;
  const desktop = layoutDesktop(chain);
  const ariaLabel = `인과 다이어그램 — ${headline.title}. ${accessibleDescription(chain)}`;

  return (
    <div>
      {/* 데스크톱 (sm 이상): 가로 레이아웃 */}
      <div className="hidden sm:block">
        <svg
          role="img"
          aria-label={ariaLabel}
          viewBox={`0 0 ${desktop.width} ${desktop.height}`}
          width="100%"
          height="auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Box {...desktop.trigger} style={neutralStyle()} />
          {desktop.steps.map((p, i) => (
            <Box key={i} {...p} style={neutralStyle()} />
          ))}
          {desktop.outcomes.map((p, i) => (
            <Box
              key={i}
              {...p}
              style={outcomeStyle(chain.outcomes[i].impact)}
            />
          ))}

          {/* TODO(다음 라운드): 베지어 화살표 + 범례 */}
        </svg>
      </div>

      {/* 모바일: 다음 라운드 (작업 순서 6) */}
      <div className="block sm:hidden rounded-md border border-dashed border-line p-6 text-center text-caption text-fg-subtle">
        모바일 세로 레이아웃은 다음 라운드에서 추가 ({CATEGORY_LABELS[meta.category]})
      </div>
    </div>
  );
}
