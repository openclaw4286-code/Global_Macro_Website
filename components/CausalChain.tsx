import {
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
// 박스 세로 padding은 호출처별로 다르게 — 데스크톱은 시각적 무게가 필요하지만,
// 모바일은 outcome HTML 카드(py-3)와 시각 무게를 맞추기 위해 더 작게.
const DESKTOP_PAD_Y = 12;
const MOBILE_PAD_Y = 10;
const TEXT_SUB_GAP = 4;
const MAX_LINES = 2;

const MIN_BOX_W = 100;
const MAX_BOX_W = 240;
const COL_GAP = 56;       // 데스크톱 컬럼 간격
const OUTCOME_GAP = 12;   // outcome 박스 세로 간격
const MOBILE_SECTION_GAP = 32; // 모바일 섹션 간격 (화살표 공간)
const MOBILE_FANOUT_GAP = 28;  // 모바일 lastStep → outcomes 간격

const STROKE_W = 1;
const ARROW_STROKE_W = 1.5;
const ARROW_GAP = 3;      // 화살표 끝과 박스 사이 시각적 여백
const RADIUS = 8;

// ─── 문자폭 휴리스틱 (서버 사이드, DOM 측정 없이) ─────
function charWidth(ch: string, fontSize: number): number {
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

function wrapLines(text: string, fontSize: number, maxWidth: number): string[] {
  if (measure(text, fontSize) <= maxWidth) return [text];

  const tokens = text.match(/\S+\s*|\s+/g) ?? [text];
  const lines: string[] = [];
  let cur = "";
  for (const tok of tokens) {
    const candidate = cur + tok;
    if (measure(candidate, fontSize) <= maxWidth) {
      cur = candidate;
    } else {
      if (cur) lines.push(cur.trimEnd());
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
  if (lines.length > MAX_LINES) lines.length = MAX_LINES;

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
  padY: number;
};

function layoutBox(node: ChainNode, padY: number = DESKTOP_PAD_Y): BoxLayout {
  const innerMax = MAX_BOX_W - PAD_X * 2;
  const textLines = wrapLines(node.text, TEXT_FS, innerMax);
  const subLines = wrapLines(node.sub, SUB_FS, innerMax);
  const widest = Math.max(
    ...textLines.map((l) => measure(l, TEXT_FS)),
    ...subLines.map((l) => measure(l, SUB_FS))
  );
  const width = Math.min(MAX_BOX_W, Math.max(MIN_BOX_W, Math.ceil(widest) + PAD_X * 2));
  const height =
    padY +
    textLines.length * TEXT_LH +
    TEXT_SUB_GAP +
    subLines.length * SUB_LH +
    padY;
  return { textLines, subLines, width, height, padY };
}

// ─── 색 매핑 ─────────────────────────────────────────────
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
    strokeWidth: STROKE_W,
  };
}

function outcomeStyle(impact: Outcome["impact"]): BoxStyle {
  if (impact === "neutral") return neutralStyle();
  // 색 정체성은 stroke가, 가독성은 텍스트가 담당하도록 역할 분리.
  // IMPACT_COLORS hex는 흰 배경 대비 WCAG AA 본문 기준(4.5:1) 미달.
  return {
    fill: "var(--surface)",
    stroke: IMPACT_COLORS[impact],
    textColor: "var(--text-primary)",
    subColor: "var(--text-secondary)",
    strokeWidth: STROKE_W,
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
  const { width, height, textLines, subLines, padY } = layout;
  const textBlockY = y + padY + TEXT_FS;
  const subBlockY =
    y + padY + textLines.length * TEXT_LH + TEXT_SUB_GAP + SUB_FS;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={RADIUS}
        ry={RADIUS}
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

// ─── 베지어 화살표 ──────────────────────────────────────
type Pt = { x: number; y: number };

function bezierH(from: Pt, to: Pt): string {
  // 가로 흐름: 양 끝에서 수평 접선이 되도록 control point의 y를 from/to의 y로 고정.
  const dx = Math.max(20, (to.x - from.x) * 0.5);
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
}

function bezierV(from: Pt, to: Pt): string {
  // 세로 흐름: 양 끝에서 수직 접선.
  const dy = Math.max(20, (to.y - from.y) * 0.5);
  return `M ${from.x} ${from.y} C ${from.x} ${from.y + dy}, ${to.x} ${to.y - dy}, ${to.x} ${to.y}`;
}

// ─── Placement → 화살표 끝점 헬퍼 ──────────────────────
type Placement = { layout: BoxLayout; x: number; y: number };

const fromRight = (p: Placement): Pt => ({
  x: p.x + p.layout.width,
  y: p.y + p.layout.height / 2,
});
const toLeft = (p: Placement): Pt => ({
  x: p.x - ARROW_GAP,
  y: p.y + p.layout.height / 2,
});
const fromBottom = (p: Placement): Pt => ({
  x: p.x + p.layout.width / 2,
  y: p.y + p.layout.height,
});
const toTop = (p: Placement): Pt => ({
  x: p.x + p.layout.width / 2,
  y: p.y - ARROW_GAP,
});

// ─── 데스크톱 레이아웃 ─────────────────────────────────
function layoutDesktop(chain: CausalChainType) {
  const triggerL = layoutBox(chain.trigger);
  const stepLs = chain.steps.map((s) => layoutBox(s));
  const outcomeLs = chain.outcomes.map((o) => layoutBox(o));

  const outcomeColW = Math.max(...outcomeLs.map((l) => l.width));
  const outcomesTotalH =
    outcomeLs.reduce((s, l) => s + l.height, 0) +
    OUTCOME_GAP * (outcomeLs.length - 1);

  const columns: number[] = [
    triggerL.width,
    ...stepLs.map((l) => l.width),
    outcomeColW,
  ];
  const xs: number[] = [];
  let cursor = 0;
  for (const w of columns) {
    xs.push(cursor);
    cursor += w + COL_GAP;
  }
  const totalW = cursor - COL_GAP;
  const totalH = Math.max(
    triggerL.height,
    ...stepLs.map((l) => l.height),
    outcomesTotalH
  );

  const triggerY = (totalH - triggerL.height) / 2;
  const stepYs = stepLs.map((l) => (totalH - l.height) / 2);

  const outcomeYs: number[] = [];
  {
    const startY = (totalH - outcomesTotalH) / 2;
    let y = startY;
    for (const l of outcomeLs) {
      outcomeYs.push(y);
      y += l.height + OUTCOME_GAP;
    }
  }
  const outcomesX = xs[xs.length - 1];

  return {
    width: totalW,
    height: totalH,
    trigger: { layout: triggerL, x: xs[0], y: triggerY } as Placement,
    steps: stepLs.map((l, i) => ({
      layout: l,
      x: xs[1 + i],
      y: stepYs[i],
    })) as Placement[],
    outcomes: outcomeLs.map((l, i) => ({
      layout: l,
      x: outcomesX + (outcomeColW - l.width) / 2,
      y: outcomeYs[i],
    })) as Placement[],
  };
}

function desktopArrows(d: ReturnType<typeof layoutDesktop>): string[] {
  const arrows: string[] = [];
  const seq: Placement[] = [d.trigger, ...d.steps];
  for (let i = 0; i < seq.length - 1; i++) {
    arrows.push(bezierH(fromRight(seq[i]), toLeft(seq[i + 1])));
  }
  // fan-out: lastStep → 각 outcome
  const last = seq[seq.length - 1];
  for (const o of d.outcomes) {
    arrows.push(bezierH(fromRight(last), toLeft(o)));
  }
  return arrows;
}

// ─── 모바일 레이아웃 (trigger + steps만) ────────────────
// outcomes는 SVG 외부 HTML 그룹(MobileOutcomeGroups)에서 impact별로 묶어 렌더.
// 분리 이유:
//  1) 그룹 헤더(impact dot + 라벨 + 개수)를 시맨틱 <h3>·<ul>로 표현 → 접근성 향상
//  2) outcome이 4+개일 때 모바일 단일 SVG 세로 스택은 화면을 너무 길게 만듦
//  3) impact별 그룹화는 색상에만 의존하지 않는 분류 정보 제공
function layoutMobileChain(chain: CausalChainType) {
  const triggerL = layoutBox(chain.trigger, MOBILE_PAD_Y);
  const stepLs = chain.steps.map((s) => layoutBox(s, MOBILE_PAD_Y));

  const totalW = Math.max(triggerL.width, ...stepLs.map((l) => l.width));

  let cy = 0;
  const triggerY = cy;
  cy += triggerL.height + MOBILE_SECTION_GAP;

  const stepYs: number[] = [];
  for (let i = 0; i < stepLs.length; i++) {
    stepYs.push(cy);
    cy += stepLs[i].height;
    // 마지막 step 이후엔 SECTION_GAP 대신 FANOUT_GAP — outcome 그룹으로의
    // stub 화살표가 차지할 공간.
    cy += i === stepLs.length - 1 ? MOBILE_FANOUT_GAP : MOBILE_SECTION_GAP;
  }

  const centerX = (l: BoxLayout) => (totalW - l.width) / 2;

  return {
    width: totalW,
    height: cy,
    trigger: { layout: triggerL, x: centerX(triggerL), y: triggerY } as Placement,
    steps: stepLs.map((l, i) => ({
      layout: l,
      x: centerX(l),
      y: stepYs[i],
    })) as Placement[],
  };
}

function mobileChainArrows(m: ReturnType<typeof layoutMobileChain>): string[] {
  const arrows: string[] = [];
  const seq: Placement[] = [m.trigger, ...m.steps];
  for (let i = 0; i < seq.length - 1; i++) {
    arrows.push(bezierV(fromBottom(seq[i]), toTop(seq[i + 1])));
  }
  // 마지막 step에서 outcome 그룹(SVG 아래 HTML)으로 향하는 stub 화살표.
  // SVG 하단까지 짧게 그어 흐름이 다음 섹션으로 이어짐을 시각적으로 표현.
  const last = seq[seq.length - 1];
  const stubFrom = fromBottom(last);
  const stubTo = { x: stubFrom.x, y: m.height - ARROW_GAP };
  arrows.push(bezierV(stubFrom, stubTo));
  return arrows;
}

// ─── 모바일 outcome 그룹 (HTML) ────────────────────────
// SVG 박스 스타일을 시맨틱 <ul>/<li>로 옮긴 것:
//  border 색 = impact 색 (neutral은 border-strong)
//  background = surface (neutral은 surface-sunken)
//  텍스트 사이즈는 SVG와 동일 (label 13px / caption 12px)
const MOBILE_GROUP_ORDER: Outcome["impact"][] = ["positive", "negative", "neutral"];

function MobileOutcomeGroups({ outcomes }: { outcomes: Outcome[] }) {
  const groups = MOBILE_GROUP_ORDER.map((impact) => ({
    impact,
    items: outcomes.filter((o) => o.impact === impact),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      {groups.map((g, gi) => {
        // 좌측 4px 막대 색만 impact로 변주. 나머지(bg·gray border·라운드·padding·텍스트)는
        // SVG trigger·step 박스(neutralStyle)와 동일하게 — 모바일 사슬과 outcome 카드의
        // 시각적 연속성 확보. neutral은 분류 없음 → 좌측 막대도 약한 회색.
        const sideBarColor =
          g.impact === "neutral"
            ? "var(--border-default)"
            : IMPACT_COLORS[g.impact];
        return (
          <section key={g.impact} className={gi === 0 ? "" : "mt-6"}>
            <h3 className="flex items-center gap-2 text-label text-fg">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: IMPACT_COLORS[g.impact] }}
              />
              <span>{IMPACT_LABELS[g.impact]}</span>
              <span className="text-fg-muted">({g.items.length})</span>
            </h3>
            <ul className="mt-2 flex flex-col gap-2">
              {g.items.map((o, i) => (
                <li
                  key={i}
                  className="rounded-sm border border-l-4 border-line-strong bg-surface-sunken px-4 py-3 text-center"
                  style={{ borderLeftColor: sideBarColor }}
                >
                  <div className="text-label text-fg">{o.text}</div>
                  <div className="mt-1 text-caption text-fg-muted">{o.sub}</div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

// ─── 범례 ──────────────────────────────────────────────
const LEGEND_ORDER: Outcome["impact"][] = ["positive", "negative", "neutral"];

function Legend({ outcomes }: { outcomes: Outcome[] }) {
  const present = new Set(outcomes.map((o) => o.impact));
  const items = LEGEND_ORDER.filter((i) => present.has(i));
  return (
    <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-fg-muted">
      {items.map((impact) => (
        <li key={impact} className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: IMPACT_COLORS[impact] }}
          />
          <span>{IMPACT_LABELS[impact]}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── 화살표 마커 ───────────────────────────────────────
function ArrowMarker({ id }: { id: string }) {
  return (
    <defs>
      <marker
        id={id}
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-default)" />
      </marker>
    </defs>
  );
}

function Arrows({ paths, markerId }: { paths: string[]; markerId: string }) {
  return (
    <g>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth={ARROW_STROKE_W}
          markerEnd={`url(#${markerId})`}
        />
      ))}
    </g>
  );
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
//
// 마커 id는 lesson.id로 네임스페이스 (한 페이지에 여러 다이어그램이
// 있을 경우 충돌 회피). 데스크톱·모바일 SVG가 같은 DOM에 존재하므로
// 둘에 다른 접미사(-d, -m)를 붙임.
export function CausalChain({ lesson }: { lesson: Lesson }) {
  const { chain, headline } = lesson;
  const desktop = layoutDesktop(chain);
  const mobile = layoutMobileChain(chain);
  const dArrows = desktopArrows(desktop);
  const mArrows = mobileChainArrows(mobile);
  const ariaLabel = `인과 다이어그램 — ${headline.title}. ${accessibleDescription(chain)}`;
  const dMarker = `arrow-d-${lesson.id}`;
  const mMarker = `arrow-m-${lesson.id}`;

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
          <ArrowMarker id={dMarker} />
          <Arrows paths={dArrows} markerId={dMarker} />
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
        </svg>
      </div>

      {/* 모바일 (sm 미만): SVG 사슬 + HTML 그룹 outcomes.
          mx-auto + max-w로 SVG와 outcome 그룹을 같은 폭으로 묶어 중앙 정렬.
          SVG는 width="100%"이므로 부모 너비를 그대로 받고, outcome <ul>·<li>도
          부모를 채우므로 같은 폭이 된다. MAX_BOX_W를 단일 출처로 사용. */}
      <div
        className="block sm:hidden mx-auto"
        style={{ maxWidth: MAX_BOX_W }}
      >
        <svg
          role="img"
          aria-label={ariaLabel}
          viewBox={`0 0 ${mobile.width} ${mobile.height}`}
          width="100%"
          height="auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ArrowMarker id={mMarker} />
          <Arrows paths={mArrows} markerId={mMarker} />
          <Box {...mobile.trigger} style={neutralStyle()} />
          {mobile.steps.map((p, i) => (
            <Box key={i} {...p} style={neutralStyle()} />
          ))}
        </svg>
        {/* 분기 시점: SVG 끝에 stub 화살표 + 충분한 여백으로 시각적 구분 */}
        <div className="mt-6">
          <MobileOutcomeGroups outcomes={chain.outcomes} />
        </div>
      </div>

      <Legend outcomes={chain.outcomes} />
    </div>
  );
}
