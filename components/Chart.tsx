import type { ChartData } from "@/schema/lesson";

// ─── 차트 viewBox 및 패딩 (논리 좌표) ───────────────────
const VIEW_W = 480;
const VIEW_H = 280;
const PAD_TOP = 28;     // value 라벨이 점 위에 들어갈 공간
const PAD_RIGHT = 24;
const PAD_BOTTOM = 36;  // x-축 라벨 공간
const PAD_LEFT = 56;    // y-축 tick 라벨 공간
const PLOT_W = VIEW_W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM;

const TICK_FS = 11;
const VALUE_LABEL_FS = 11;
const TICK_COUNT = 4;

// ─── Nice tick 알고리즘 ─────────────────────────────────
// 데이터 범위를 보고 0/25/50/75/100 같은 round 숫자로 tick 생성.
// (Heckbert 1990 — graphics gems "Nice Numbers for Graph Labels")
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
    // 모든 값이 같은 경우 — 위·아래 약간씩 padding.
    const pad = Math.abs(min) * 0.1 || 1;
    return niceTicks(min - pad, max + pad, count);
  }
  const range = niceNumber(max - min, false);
  const step = niceNumber(range / Math.max(1, count - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  // float 누적 오차 방지
  for (let i = 0; i <= Math.round((niceMax - niceMin) / step); i++) {
    ticks.push(niceMin + i * step);
  }
  return { min: niceMin, max: niceMax, step, ticks };
}

// ─── 값 표기 ────────────────────────────────────────────
function formatValue(v: number): string {
  if (Math.abs(v) >= 1000) return v.toLocaleString("en-US");
  // 정수면 그대로, 아니면 소수점 1자리
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

// ─── LineChart ──────────────────────────────────────────
function LineChart({ chart }: { chart: ChartData }) {
  const { values, xLabels } = chart;
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const { min: yMin, max: yMax, ticks } = niceTicks(dataMin, dataMax, TICK_COUNT);

  const xPx = (i: number) =>
    PAD_LEFT + (values.length === 1 ? PLOT_W / 2 : (i / (values.length - 1)) * PLOT_W);
  const yPx = (v: number) =>
    PAD_TOP + PLOT_H - ((v - yMin) / (yMax - yMin)) * PLOT_H;

  const linePath =
    values
      .map((v, i) => `${i === 0 ? "M" : "L"} ${xPx(i).toFixed(2)} ${yPx(v).toFixed(2)}`)
      .join(" ");

  return (
    <svg
      role="img"
      aria-label={chartAriaLabel(chart)}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      height="auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 가로 격자선 (각 y-tick) */}
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

      {/* y-축 tick 라벨 */}
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

      {/* x-축 라벨 */}
      <g>
        {xLabels.map((label, i) => (
          <text
            key={`xl-${i}`}
            x={xPx(i)}
            y={PAD_TOP + PLOT_H + 18}
            textAnchor="middle"
            fontSize={TICK_FS}
            fill="var(--text-secondary)"
          >
            {label}
          </text>
        ))}
      </g>

      {/* 데이터 라인 */}
      <path
        d={linePath}
        fill="none"
        stroke="var(--accent-brand)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* 데이터 점 */}
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

      {/* 값 라벨 (각 점 위) */}
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

// ─── 메인 분기 ──────────────────────────────────────────
// bar는 다음 라운드. 그 전까진 이 컴포넌트에서 line만 처리.
export function Chart({ chart }: { chart: ChartData }) {
  return (
    <figure className="rounded-md border border-line bg-surface p-5">
      <figcaption className="mb-3">
        <h3 className="text-heading-2 text-fg">{chart.label}</h3>
        {chart.caption ? (
          <p className="mt-1 text-caption text-fg-muted">{chart.caption}</p>
        ) : null}
      </figcaption>
      {chart.type === "line" ? (
        <LineChart chart={chart} />
      ) : (
        <div className="rounded-md border border-dashed border-line p-6 text-center text-caption text-fg-subtle">
          bar 차트는 2-B 다음 라운드에서 추가
        </div>
      )}
    </figure>
  );
}
