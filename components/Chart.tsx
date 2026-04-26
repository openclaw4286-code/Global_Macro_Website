import type { ChartData } from "@/schema/lesson";

// ─── 차트 viewBox 및 패딩 (논리 좌표) ───────────────────
const VIEW_W = 480;
const VIEW_H = 280;
const PAD_TOP = 36;     // 값 라벨이 항상 plot 위 안전 영역에 자리잡도록 36
const PAD_RIGHT = 24;
const PAD_BOTTOM = 36;  // x-축 라벨 공간
const PAD_LEFT = 56;    // y-축 tick 라벨 공간
const PLOT_W = VIEW_W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM;

const TICK_FS = 11;
const VALUE_LABEL_FS = 11;
const TICK_COUNT = 4;

// ─── Nice tick 알고리즘 (Heckbert 1990) ─────────────────
function niceNumber(value: number, round: boolean): number {
  if (value === 0) return 0;
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const fraction = Math.abs(value) / Math.pow(10, exp);
  let nice: number;
  if (round) {
    if (fraction < 1.5) nice = 1;
    else if (fraction < 3) nice = 2;
    else if (fraction < 7) nice = 5;
    else nice = 10;
  } else {
    if (fraction <= 1) nice = 1;
    else if (fraction <= 2) nice = 2;
    else if (fraction <= 5) nice = 5;
    else nice = 10;
  }
  return Math.sign(value) * nice * Math.pow(10, exp);
}

function niceTicks(min: number, max: number, count: number): {
  min: number;
  max: number;
  step: number;
  ticks: number[];
} {
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    return niceTicks(min - pad, max + pad, count);
  }
  const range = niceNumber(max - min, false);
  const step = niceNumber(range / Math.max(1, count - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let i = 0; i <= Math.round((niceMax - niceMin) / step); i++) {
    ticks.push(niceMin + i * step);
  }
  return { min: niceMin, max: niceMax, step, ticks };
}

// ─── 값 표기 ────────────────────────────────────────────
function formatValue(v: number): string {
  if (Math.abs(v) >= 1000) return v.toLocaleString("en-US");
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

// ─── 접근성 ─────────────────────────────────────────────
function chartAriaLabel(chart: ChartData): string {
  const head = `${chart.label}${chart.caption ? `. ${chart.caption}` : ""}`;
  const points = chart.xLabels
    .map((x, i) => `${x} ${formatValue(chart.values[i])}`)
    .join(", ");
  return `${head}. 데이터: ${points}.`;
}

// ─── 공통: 격자 + y-tick 라벨 ──────────────────────────
function GridAndYTicks({
  ticks,
  yPx,
}: {
  ticks: number[];
  yPx: (v: number) => number;
}) {
  return (
    <>
      <g>
        {ticks.map((t, i) => {
          const y = yPx(t);
          return (
            <line
              key={`grid-${i}`}
              x1={PAD_LEFT}
              x2={PAD_LEFT + PLOT_W}
              y1={y}
              y2={y}
              stroke="var(--border-subtle)"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
          );
        })}
      </g>
      <g>
        {ticks.map((t, i) => (
          <text
            key={`yt-${i}`}
            x={PAD_LEFT - 8}
            y={yPx(t)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={TICK_FS}
            fill="var(--text-secondary)"
          >
            {formatValue(t)}
          </text>
        ))}
      </g>
    </>
  );
}

// ─── 공통: x-축 라벨 (cx 배열을 받음) ─────────────────
function XTickLabels({ xs, labels }: { xs: number[]; labels: string[] }) {
  return (
    <g>
      {labels.map((label, i) => (
        <text
          key={`xl-${i}`}
          x={xs[i]}
          y={PAD_TOP + PLOT_H + 18}
          textAnchor="middle"
          fontSize={TICK_FS}
          fill="var(--text-secondary)"
        >
          {label}
        </text>
      ))}
    </g>
  );
}

// ─── LineChart ──────────────────────────────────────────
function LineChart({ chart }: { chart: ChartData }) {
  const { values, xLabels } = chart;
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const { min: yMin, max: yMax, ticks } = niceTicks(dataMin, dataMax, TICK_COUNT);

  // line은 데이터 점이 plot 좌·우 끝에 닿음 (시계열 연속성 표현).
  const xPx = (i: number) =>
    PAD_LEFT + (values.length === 1 ? PLOT_W / 2 : (i / (values.length - 1)) * PLOT_W);
  const yPx = (v: number) =>
    PAD_TOP + PLOT_H - ((v - yMin) / (yMax - yMin)) * PLOT_H;

  const linePath = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xPx(i).toFixed(2)} ${yPx(v).toFixed(2)}`)
    .join(" ");

  const xs = values.map((_, i) => xPx(i));

  return (
    <svg
      role="img"
      aria-label={chartAriaLabel(chart)}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      height="auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <GridAndYTicks ticks={ticks} yPx={yPx} />
      <XTickLabels xs={xs} labels={xLabels} />

      <path
        d={linePath}
        fill="none"
        stroke="var(--accent-brand)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <g>
        {values.map((v, i) => (
          <circle
            key={`pt-${i}`}
            cx={xPx(i)}
            cy={yPx(v)}
            r={3.5}
            fill="var(--surface)"
            stroke="var(--accent-brand)"
            strokeWidth={2}
          />
        ))}
      </g>

      <g>
        {values.map((v, i) => (
          <text
            key={`vl-${i}`}
            x={xPx(i)}
            y={yPx(v) - 10}
            textAnchor="middle"
            fontSize={VALUE_LABEL_FS}
            fontWeight={500}
            fill="var(--text-primary)"
          >
            {formatValue(v)}
          </text>
        ))}
      </g>
    </svg>
  );
}

// ─── BarChart ───────────────────────────────────────────
function BarChart({ chart }: { chart: ChartData }) {
  const { values, xLabels } = chart;
  const dataMax = Math.max(...values);
  // bar는 항상 0 기준 (음수 데이터 등장 시 별도 처리 필요 — 현재 스키마는 number 그대로).
  const { min: yMin, max: yMax, ticks } = niceTicks(0, dataMax, TICK_COUNT);

  // bar는 카테고리. 각 데이터에 균등한 슬롯 할당, 슬롯 안 가운데에 막대.
  const slotW = PLOT_W / values.length;
  const barW = slotW * 0.6;
  const slotCenter = (i: number) => PAD_LEFT + (i + 0.5) * slotW;
  const yPx = (v: number) =>
    PAD_TOP + PLOT_H - ((v - yMin) / (yMax - yMin)) * PLOT_H;

  const xs = values.map((_, i) => slotCenter(i));

  return (
    <svg
      role="img"
      aria-label={chartAriaLabel(chart)}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      height="auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <GridAndYTicks ticks={ticks} yPx={yPx} />
      <XTickLabels xs={xs} labels={xLabels} />

      <g>
        {values.map((v, i) => {
          const top = yPx(v);
          const h = PAD_TOP + PLOT_H - top;
          if (h <= 0) return null;
          return (
            <rect
              key={`bar-${i}`}
              x={slotCenter(i) - barW / 2}
              y={top}
              width={barW}
              height={h}
              fill="var(--accent-brand)"
              fillOpacity={0.8}
              rx={2}
            />
          );
        })}
      </g>

      <g>
        {values.map((v, i) => (
          <text
            key={`vl-${i}`}
            x={slotCenter(i)}
            y={yPx(v) - 8}
            textAnchor="middle"
            fontSize={VALUE_LABEL_FS}
            fontWeight={500}
            fill="var(--text-primary)"
          >
            {formatValue(v)}
          </text>
        ))}
      </g>
    </svg>
  );
}

// ─── 메인 분기 ──────────────────────────────────────────
// figure는 본문·핵심 한 줄 박스와 위계가 평평해지지 않도록 카드 스타일을
// 쓰지 않음. 차트와 본문 구분은 mt-10 여백 + label·caption만으로.
export function Chart({ chart }: { chart: ChartData }) {
  return (
    <figure className="p-5">
      <figcaption className="mb-3">
        <h3 className="text-heading-2 text-fg">{chart.label}</h3>
        {chart.caption ? (
          <p className="mt-1 text-caption text-fg-muted">{chart.caption}</p>
        ) : null}
      </figcaption>
      {chart.type === "line" ? <LineChart chart={chart} /> : <BarChart chart={chart} />}
    </figure>
  );
}
